
import { prisma } from "@/config";
import { Booking , Room } from "@prisma/client";



async function theRoom (roomId: number): Promise<Room & { book: number }> {

   const book = await prisma.booking.count({

     where: {roomId,},

   });

    const room = await prisma.room.findUnique({ where: { id: roomId } });

   return room ? { ...room, book } : null;

 }




async function roomRegister (userId: number, roomId: number): Promise<Booking> {

   return prisma.booking.create({

     data: { roomId, userId,},

   });

}




async function findRoom (bookingId: number): Promise<{ Room: Room; id: number }> {

   const result = await prisma.booking.findFirst({ select: { id: true, Room: true }, where: { id: bookingId } });
    return result;

}



async function userRoom (userId: number): Promise<{ Room: Room; id: number }> {

   const result = await prisma.booking.findFirst({ select: { id: true, Room: true }, where: { userId } });
    return result;
  
}




async function updateRoomRegister(bookingId: number, roomId: number): Promise<void> {

   await prisma.booking.update({ where: { id: bookingId }, data: { roomId } });

}






const bookingRep = { updateRoomRegister , userRoom , roomRegister, findRoom , theRoom}
export default bookingRep;
