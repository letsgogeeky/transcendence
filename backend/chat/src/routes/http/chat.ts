// import { FastifyInstance } from "fastify";

// const newRoom = await prisma.chatRoom.create({
//     data: {
//       name: 'My Friends Group', // leave null for a DM
//       participants: {
//         create: [
//           { userId: 'user1-id' },
//           { userId: 'user2-id' },
//         ],
//       },
//     },
//   })

// const message = await prisma.message.create({
//   data: {
//     content: 'Hello there!',
//     chatRoomId: 'room-id',
//     userId: 'sender-user-id',
//   },
// })

// const messages = await prisma.message.findMany({
//   where: { chatRoomId: 'room-id' },
//   orderBy: { createdAt: 'asc' },
//   include: {
//     attachments: true,
//   },
// })

// const participants = await prisma.chatParticipant.findMany({
//   where: { chatRoomId: 'room-id' },
//   include: { chatRoom: true },
// })

// await prisma.attachment.create({
//   data: {
//     fileName: 'image.png',
//     fileUrl: 'https://cdn.example.com/image.png',
//     fileSize: 102400, // in bytes
//     mimeType: 'image/png',
//     messageId: 'message-id',
//   },
// })

// await prisma.chatParticipant.delete({
//   where: {
//     userId_chatRoomId: {
//       userId: 'user-id',
//       chatRoomId: 'room-id',
//     },
//   },
// })

// const userRooms = await prisma.chatParticipant.findMany({
//   where: { userId: 'user-id' },
//   include: {
//     chatRoom: {
//       include: {
//         messages: {
//           orderBy: { createdAt: 'desc' },
//           take: 1,
//         },
//       },
//     },
//   },
// })
