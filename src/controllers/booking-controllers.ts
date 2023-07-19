
import { Request , Response , NextFunction } from "express";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "@/middlewares";
import bookingServBox from "@/services/booking-service";



export async function createBooking (req: AuthenticatedRequest, res: Response, next: NextFunction) {

    const { userId } = req;
 
    try {
 
      const roomId = Number(req.body.roomId);
      const result = await bookingServBox.createBooking(userId, roomId);
 
      return res.status(httpStatus.OK).send(result);
 
    } catch (error) {
 
      next(error);
 
    }
 
  }
 

 
 
 
  export async function userRoom (req: AuthenticatedRequest, res: Response, next: NextFunction) {
 
    const { userId } = req;
 
    try {
 
      const result = await bookingServBox.userRoom(userId);
 
      return res.status(httpStatus.OK).send(result);
 
    } catch (error) {
 
      next(error);
 
    }
 
  }
 
 
 
 
  export async function updateRoomRegister (req: AuthenticatedRequest, res: Response, next: NextFunction) {
 
    const { userId } = req;
 
    try {
 
      const room = Number(req.body.roomId);
      const idRoom = Number(req.params.bookingId);
      const result = await bookingServBox.updateRoomRegister(userId, idRoom, room);
 
      return res.status(httpStatus.OK).send(result);
 
    } catch (error) {
 
      next(error);
 
    }
 
  }
 