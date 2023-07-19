
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import * as jwt from 'jsonwebtoken'
import { cleanDb , generateValidToken } from "../helpers";
import app, {init} from "@/app";
import { TicketStatus } from "@prisma/client";
import { createEnrollmentWithAddress , createHotel , createPayment , createTicket, createTicketTypeWithHotel , createTicketTypeRemote,
 createRoomWithHotelId, createUser, createBooking ,  } from "../factories";


 beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

function createValidBody() {

  return {roomId: 1,};

}


describe('GET /booking', () => {

  it('NO TOKEN : 401 ERROR', async () => {

    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('INVALID TOKEN : ', async () => {

    const token = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('NO TOJEN PER SESSION: 401 ERROR', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });



  describe('valid', () => {

    it('NO BOOKING:404 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);

    });


    it('BOOKING OK : 200 STATUS ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const booking = await createBooking({

        userId: user.id,
        roomId: room.id,

      });

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({

        id: booking.id,
        Room: {

          id: expect.any(Number),
          name: expect.any(String),
          capacity: expect.any(Number),
          hotelId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),

        },

      });

    });

  });

});


describe('POST /booking', () => {

  it('NO TOKEN REGISTER : 401 ERROR', async () => {

    const validBody = createValidBody();
    const response = await server.post('/booking').send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  it('INVALID TOKEN : 401 ERROR', async () => {

    const token = faker.lorem.word();
    const validBody = createValidBody();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('NO TICKET PER SESSION : 401 ERROR', async () => {

    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const validBody = createValidBody();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  describe('valid', () => {

    it('ITS OK : 200 STATUS', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const validBody = createValidBody();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id, });

      expect(response.status).toEqual(httpStatus.OK);

    });

    it('INVALID : 400 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const validBody = createValidBody();
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: 0,});

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);

    });

    it("NO ROOM ID FOUND : 404 ERROR", async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const validBody = createValidBody();
      const response = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: room.id + 1,});

      expect(response.status).toEqual(httpStatus.NOT_FOUND);

    });

    it("NO VACANCY : 403 ERROR", async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      await createBooking({ userId: user.id, roomId: room.id,});
      await createBooking({userId: user.id,roomId: room.id,});
      await createBooking({userId: user.id,roomId: room.id,});

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: room.id,});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('No enrollment : 403 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: room.id,});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('TICKET NOT PAID : 403 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({roomId: room.id,});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

  });

});



describe('PUT /booking', () => {

  it('NO TOKEN : 401 ERROR', async () => {

    const validBody = createValidBody();
    const response = await server.put('/booking/1').send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('INVALID TOKEN : 401 ERROR', async () => {

    const token = faker.lorem.word();
    const validBody = createValidBody();
    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('NO TICKET PER SESSION : 401 ERROR', async () => {

    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const validBody = createValidBody();
    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validBody);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });



  describe('valid', () => {

    it('OK : 200 STATUS', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking({roomId: room.id,userId: user.id,});
      const otherRoom = await createRoomWithHotelId(hotel.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId: otherRoom.id,});

      expect(response.status).toEqual(httpStatus.OK);

    });


    it('INVALID : 400 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking({roomId: room.id,userId: user.id,});

      const otherRoom = await createRoomWithHotelId(hotel.id);

      const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`).send({roomId: otherRoom.id,});
      expect(response.status).toEqual(httpStatus.BAD_REQUEST);

    });

    it('INVALID : 400 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const booking = await createBooking({
        roomId: room.id,
        userId: user.id,
      });

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({
        roomId: 0,
      });

      expect(response.status).toEqual(httpStatus.BAD_REQUEST);
    });


    it("ROMM NOT FOUND : 404 ERROR", async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const booking = await createBooking({ roomId: room.id, userId: user.id,});
      const validBody = createValidBody();
      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: room.id + 1,});

      expect(response.status).toEqual(httpStatus.NOT_FOUND);

    });


    it("No reserve : 403 error", async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const otherRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking({userId: user.id,roomId: otherRoom.id,});

      await createBooking({userId: user.id,roomId: otherRoom.id,});
      await createBooking({userId: user.id,roomId: otherRoom.id,});

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({roomId: otherRoom.id,});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });


    it('NO BOKKING FOUND : 404 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);

      const otherUser = await createUser();
      const otherUserBooking = await createBooking({ userId: otherUser.id, roomId: room.id,});

      const validBody = createValidBody();
      const response = await server
        .put(`/booking/${otherUserBooking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: room.id,});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

  });

});


  
 