import { Client, ConnectConfig } from 'ssh2';
import SftpClient from 'ssh2-sftp-client';
import { ServerConfig } from './types';

export interface SSHExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SSHClient {
  private client: Client | null = null;
  private config: ConnectConfig | null = null;
  private onLog: (message: string) => void;
  private isConnected: boolean = false;

  constructor(onLog?: (message: string) => void) {
    this.onLog = onLog || console.log;
  }

  private log(message: string) {
    this.onLog(message);
  }

  async connect(serverConfig: ServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client();
      
      this.config = {
        host: serverConfig.host,
        port: serverConfig.port || 22,
        username: serverConfig.username,
        ...(serverConfig.authMethod === 'password' 
          ? { password: serverConfig.password }
          : { privateKey: serverConfig.privateKey }),
        readyTimeout: 30000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 30, // Allow up to 5 minutes of no response during builds
      };

      this.log(`Connecting to ${serverConfig.host}:${serverConfig.port}...`);

      this.client
        .on('ready', () => {
          this.isConnected = true;
          this.log(`Connected to ${serverConfig.host}`);
          resolve();
        })
        .on('error', (err) => {
          this.isConnected = false;
          this.log(`Connection error: ${err.message}`);
          reject(err);
        })
        .on('end', () => {
          this.isConnected = false;
          this.log('SSH connection ended');
        })
        .on('close', () => {
          this.isConnected = false;
          this.log('SSH connection closed');
        })
        .connect(this.config);
    });
  }

  async exec(command: string, options?: { cwd?: string }): Promise<SSHExecResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('SSH connection lost - please retry deployment');
    }

    const fullCommand = options?.cwd 
      ? `cd ${options.cwd} && ${command}`
      : command;

    this.log(`Executing: ${command}`);

    return new Promise((resolve, reject) => {
      this.client!.exec(fullCommand, (err, stream) => {
        if (err) {
          reject(new Error(`SSH exec failed: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number) => {
            resolve({ stdout, stderr, exitCode: code });
          })
          .on('error', (streamErr: Error) => {
            reject(new Error(`SSH stream error: ${streamErr.message}`));
          })
          .on('data', (data: Buffer) => {
            const text = data.toString();
            stdout += text;
            // Log each line
            text.split('\n').filter(Boolean).forEach(line => this.log(line));
          })
          .stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            stderr += text;
            text.split('\n').filter(Boolean).forEach(line => this.log(`[stderr] ${line}`));
          });
      });
    });
  }

  async uploadFile(content: string, remotePath: string): Promise<void> {
    if (!this.config) {
      throw new Error('Not connected');
    }

    const sftp = new SftpClient();
    
    try {
      this.log(`Uploading file to ${remotePath}...`);
      
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
      });

      // Ensure directory exists
      const dir = remotePath.substring(0, remotePath.lastIndexOf('/'));
      try {
        await sftp.mkdir(dir, true);
      } catch {
        // Directory might already exist
      }

      // Upload content as buffer
      const buffer = Buffer.from(content, 'utf-8');
      await sftp.put(buffer, remotePath);
      
      this.log(`File uploaded to ${remotePath}`);
    } finally {
      await sftp.end();
    }
  }

  async uploadDirectory(localPath: string, remotePath: string): Promise<void> {
    if (!this.config) {
      throw new Error('Not connected');
    }

    const sftp = new SftpClient();
    
    try {
      this.log(`Uploading directory to ${remotePath}...`);
      
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey,
      });

      await sftp.uploadDir(localPath, remotePath);
      
      this.log(`Directory uploaded to ${remotePath}`);
    } finally {
      await sftp.end();
    }
  }

  async exists(remotePath: string): Promise<boolean> {
    try {
      const result = await this.exec(`test -e ${remotePath} && echo "exists"`);
      return result.stdout.includes('exists');
    } catch {
      return false;
    }
  }

  async mkdir(remotePath: string): Promise<void> {
    await this.exec(`mkdir -p ${remotePath}`);
  }

  disconnect(): void {
    if (this.client) {
      this.isConnected = false;
      this.client.end();
      this.client = null;
      this.log('Disconnected from server');
    }
  }
}

// Test connection without executing commands
export async function testConnection(serverConfig: ServerConfig): Promise<{ success: boolean; error?: string }> {
  const client = new SSHClient();
  
  try {
    await client.connect(serverConfig);
    await client.exec('echo "Connection successful"');
    client.disconnect();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
}
