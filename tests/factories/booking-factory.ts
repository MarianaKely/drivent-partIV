
import { prisma } from "@/config";
import { Booking , Room } from "@prisma/client";
import { bookingCongigs } from "@/protocols";



export function createBooking({ roomId, userId }: bookingCongigs) {

  return prisma.booking.create({

    data: {userId,roomId,},

  });

}


export function returnRomm() {

  const result: Booking & { Room: Room } = {

    id: 1,
    userId: 1,
    roomId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    Room: {
      id: 1,
      name: 'Room 1',
      capacity: 2,
      hotelId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),

    },

  };

  return result;
}