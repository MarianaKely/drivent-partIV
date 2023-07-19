
import { Router } from "express";
import { authenticateToken , validateBody } from "@/middlewares";
import { bookingSchema } from "@/schemas/booking-schema";
import { createBooking , updateRoomRegister ,userRoom } from "@/controllers";


const bookingRoute = Router()


bookingRoute
 .all('/*', authenticateToken)
 .post('/', validateBody(bookingSchema), createBooking)
 .get('/', userRoom)
 .put('/:bookingId', validateBody(bookingSchema), updateRoomRegister);


export { bookingRoute };
