
import { prisma } from "@/config";
import { Booking } from "@prisma/client";


export async function booking (roomId: number, userId: number): Promise<Booking> {

    return prisma.booking.create({

      data: { roomId, userId, },

    });

  }