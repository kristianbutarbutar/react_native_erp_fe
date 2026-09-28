import io from 'socket.io-client';

const SOCKET_VOICE_SERVER_URL = 'http://127.0.0.1:3006';

export class VoiceCallManager {
    private socket: any = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private nextPlayTime: number = 0;

    public connect(uid: string, touid: string, onStatusChange: (status: string) => void) {
        onStatusChange('Connecting to Voice Bridge...');

        this.socket = io(SOCKET_VOICE_SERVER_URL);

        this.socket.on('connect', () => {
            onStatusChange('Waiting for room assignment...');
            this.socket.emit('join_voice_call', { uid, touid: [touid] });
        });

        this.socket.on('voice_room_ready', (data: any) => {
            onStatusChange('Connected to Voice Room');
            console.log('Voice Room Ready:', data);
            this.startMicrophoneStream();
        });

        this.socket.on('audio_stream', (pcmChunk: ArrayBuffer) => {
            this.playAudioChunk(pcmChunk);
        });

        this.socket.on('voice_error', (err: any) => {
            onStatusChange('Error: ' + err.message);
        });
    }

    private async startMicrophoneStream() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

            this.processor.onaudioprocess = (e) => {
                if (!this.socket || !this.socket.connected) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                }

                // Emit raw PCM buffer to Node.js voice bridge
                this.socket.emit('audio_stream', pcm16.buffer);
            };

            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            // -----------------------------------------------------------------
            // OPTIONAL LOCAL MONITORING: 
            // Uncomment below to hear your own microphone audio locally for testing.
            // -----------------------------------------------------------------
            /*
            const monitorGain = this.audioContext.createGain();
            monitorGain.gain.value = 1.0; // Volume level (0.0 to 1.0)
            this.source.connect(monitorGain);
            monitorGain.connect(this.audioContext.destination);
            */

        } catch (err) {
            console.error('Failed to capture microphone input:', err);
        }
    }

    private playAudioChunk(pcmBuffer: ArrayBuffer) {
        if (!this.audioContext) return;

        const int16Data = new Int16Array(pcmBuffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 0x7FFF;
        }

        const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 16000);
        audioBuffer.getChannelData(0).set(float32Data);

        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;
        if (this.nextPlayTime < currentTime) {
            this.nextPlayTime = currentTime;
        }

        sourceNode.start(this.nextPlayTime);
        this.nextPlayTime += audioBuffer.duration;
    }

    public setMuted(muted: boolean) {
        if (this.mediaStream) {
            this.mediaStream.getAudioTracks().forEach(track => {
                track.enabled = !muted;
            });
        }
    }

    public disconnect() {
        if (this.processor && this.source && this.audioContext) {
            this.source.disconnect();
            this.processor.disconnect();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.audioContext = null;
        this.mediaStream = null;
        this.nextPlayTime = 0;
    }
}