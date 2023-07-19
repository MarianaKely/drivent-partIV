
import { ApplicationError } from "@/protocols";


export function bookingError(message = 'Booking  error'): ApplicationError {

    return {name: 'BookingError',message,};
 
  }
 