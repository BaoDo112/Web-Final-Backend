import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface RoomMember {
    socketId: string;
    userId: string;
    userName: string;
    role: 'interviewer' | 'interviewee';
}

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:3001', 'https://nervis.dev'],
        credentials: true,
    },
    namespace: '/video-call',
})
export class VideoCallGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // roomId -> Map<socketId, RoomMember>
    private rooms = new Map<string, Map<string, RoomMember>>();

    handleConnection(client: Socket) {
        console.log(`📹 Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`📹 Client disconnected: ${client.id}`);
        // Remove from all rooms
        this.rooms.forEach((members, roomId) => {
            if (members.has(client.id)) {
                const member = members.get(client.id);
                members.delete(client.id);
                // Notify others in room
                if (member) {
                    client.to(roomId).emit('user-left', { userId: member.userId, userName: member.userName });
                }
                if (members.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        });
    }

    @SubscribeMessage('join-room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; userName: string; role: 'interviewer' | 'interviewee' }
    ) {
        const { roomId, userId, userName, role } = data;
        console.log(`📹 ${userName} joining room ${roomId} as ${role}`);

        // Join socket.io room
        client.join(roomId);

        // Track in our rooms map
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        this.rooms.get(roomId)!.set(client.id, {
            socketId: client.id,
            userId,
            userName,
            role,
        });

        // Get other users in room
        const otherUsers: RoomMember[] = [];
        this.rooms.get(roomId)!.forEach((member, socketId) => {
            if (socketId !== client.id) {
                otherUsers.push(member);
            }
        });

        // Notify new user of existing users
        client.emit('room-users', { users: otherUsers });

        // Notify existing users of new user
        client.to(roomId).emit('user-joined', {
            userId,
            userName,
            role,
            socketId: client.id,
        });

        return { success: true, roomId };
    }

    @SubscribeMessage('leave-room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string }
    ) {
        const { roomId } = data;
        client.leave(roomId);

        if (this.rooms.has(roomId)) {
            const member = this.rooms.get(roomId)!.get(client.id);
            this.rooms.get(roomId)!.delete(client.id);

            if (member) {
                client.to(roomId).emit('user-left', { userId: member.userId, userName: member.userName });
            }

            if (this.rooms.get(roomId)!.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        return { success: true };
    }

    // WebRTC Signaling
    @SubscribeMessage('offer')
    handleOffer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetSocketId: string; offer: any }
    ) {
        console.log(`📹 Offer from ${client.id} to ${data.targetSocketId}`);
        this.server.to(data.targetSocketId).emit('offer', {
            offer: data.offer,
            fromSocketId: client.id,
        });
    }

    @SubscribeMessage('answer')
    handleAnswer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetSocketId: string; answer: any }
    ) {
        console.log(`📹 Answer from ${client.id} to ${data.targetSocketId}`);
        this.server.to(data.targetSocketId).emit('answer', {
            answer: data.answer,
            fromSocketId: client.id,
        });
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; targetSocketId: string; candidate: any }
    ) {
        this.server.to(data.targetSocketId).emit('ice-candidate', {
            candidate: data.candidate,
            fromSocketId: client.id,
        });
    }

    // Chat messages
    @SubscribeMessage('chat-message')
    handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; userId: string; userName: string; message: string }
    ) {
        const { roomId, userId, userName, message } = data;

        // Broadcast to everyone in room including sender
        this.server.to(roomId).emit('chat-message', {
            userId,
            userName,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
