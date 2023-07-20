
import { prisma } from "@/config";
import { Booking , Room } from "@prisma/client";



export async function createBooking(roomId: number, userId: number): Promise<Booking> {

  return prisma.booking.create({

    data: {roomId,userId,},

  });
  
}