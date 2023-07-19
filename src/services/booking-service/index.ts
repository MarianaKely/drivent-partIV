
import { notFoundError , bookingError } from "@/errors";
import bookingRep from "@/repositories/booking-reposiroty";
import { Room } from "@prisma/client";
import ticketsRepository from "@/repositories/tickets-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";




async function createBooking (userId: number, roomId: number): Promise<{ bookingId: number }> {

    const user = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!user) {throw bookingError('user not found');}
 
    const ticket = await ticketsRepository.findTicketByEnrollmentId(user.id);
    if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {throw bookingError('Invalid ticket');}

    const booking = await bookingRep.theRoom(roomId);
    if (!booking) { throw notFoundError();}
    if (!(booking.capacity > booking.book)) {
    throw bookingError('Not found');

    }

     const result = await bookingRep.roomRegister(userId, roomId);

     return { bookingId: result.id };
 
  }

 
 
 
  async function userRoom (userId: number): Promise<{ id: number; Room: Room }> {
 
    const user = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!user) throw notFoundError();
 
    const ticket = await ticketsRepository.findTicketByEnrollmentId(user.id);
    if (!ticket) throw notFoundError();

    const result = await bookingRep.userRoom(userId);
    if (!result) throw notFoundError();
    return result;
 
  }
 
 
 
 
  async function updateRoomRegister (userId: number, bookingId: number, roomId: number): Promise<{ bookingId: number }> {
 
    const user = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!user) { throw bookingError('user not found');}

    const ticket = await ticketsRepository.findTicketByEnrollmentId(user.id);
    if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {throw bookingError('Invalid ticket');}

    const booking = await bookingRep.findRoom(bookingId);
    if (!booking) throw bookingError('No previous booking');
 
    const result = await bookingRep.theRoom(roomId);
    if (!result) throw notFoundError();
    if (!(result.book < result.capacity)) throw bookingError('Not found');
    await bookingRep.updateRoomRegister(booking.id, result.id);
    return { bookingId: booking.id };
 
  }
 
 
  const bookingServBox =  {updateRoomRegister , createBooking, userRoom}
 
 
  export default bookingServBox