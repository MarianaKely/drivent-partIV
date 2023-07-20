
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import * as jwt from 'jsonwebtoken'
import { cleanDb , generateValidToken } from "../helpers";
import app , {init} from "@/app";
import { TicketStatus } from "@prisma/client";
import { createEnrollmentWithAddress , createBooking , createPayment , 
createRoomWithHotelId , createHotel , createTicket , createTicketTypeRemote , 
createTicketTypeWithHotel , createUser } from "../factories";



beforeAll(async () => {await init();});

beforeEach(async () => {await cleanDb();});

const server = supertest(app);


describe('POST /booking', () => {

  it('NO TOKEN : 401 ERROR', async () => {

    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  it('INVALID TOKEN : 401 ERROR', async () => {

    const token = faker.lorem.word();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('NO TOKEN PER SESSION : 401 ERROR', async () => {

    const user = await createUser();
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  describe('POST /booking : valid token', () => {

    it('REMOTE TICKET: 403 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      await createPayment(ticket.id, ticketType.price);

      const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('NOT PAID : 4003 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('NO ENROLLMENT: 403 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('NOT FOUND ROOM : 404 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await prisma.room.findMany({});

      const response = await server.post('/booking').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);

    });


    it('NO RESERVED : 403 ERROR ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      const userR = await createUser();  

      await createBooking(theRoom.id, userR.id);
      await createBooking(theRoom.id, userR.id);

      const response = await server.post('/booking').send({ roomId: theRoom.id }).set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);

    });

    it('should respond with status 200 and booking id', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 1 });

      const response = await server.post('/booking').send({ roomId: theRoom.id }).set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);

      const responsetWO = await prisma.booking.findFirst();
      expect(responsetWO.id).toBe(response.body.bookingId);

    });

  });

});

describe('GET /booking', () => {

  it('NO TOKEN : 401 ERROR', async () => {

    const response = await server.get('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  it('INVALID TOKEN:401 ERROR', async () => {

    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });


  it('NO TOKEN PER SESSION : 401 ERROR', async () => {

    const user = await createUser();
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  describe(' GET /booking : valid token', () => {

    it('NO ENROLLMENT 404 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);

    });



    it('NO TICKET : 404 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);

      await createEnrollmentWithAddress(user);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);

    });

    it('NO BOOKING : 404 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);

    });

    it('OK BOOKING : 200 STATUS', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      const theBooking = await createBooking(theRoom.id, user.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({

        id: theBooking.id,
        Room: {

          ...theRoom,
          createdAt: theRoom.createdAt.toISOString(),
          updatedAt: theRoom.updatedAt.toISOString(),

        },

      });

    });

  });

});



describe('PUT /booking', () => {

  it('NO TOKEN : 401 ERROR', async () => {

    const response = await server.put('/booking/1');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  it('INVALID TOKEN : 401 ERROR', async () => {

    const token = faker.lorem.word();
    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  it('NO TOKEN  PER SESSION : 401 ERROR', async () => {

    const user = await createUser();
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);

  });

  describe('PUT /booking : valid token', () => {

    it('INVALID : 400 STATUS', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      await createBooking(theRoom.id, user.id);

      const response = await server.put('/booking/6').send({}).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);

    });

    it('NO ENROLLMENT : 403 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.put('/booking/6').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);

    });

    it('NO TICKET : 403 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);

      await createEnrollmentWithAddress(user);

      const response = await server.put('/booking/6').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.FORBIDDEN);

    });

    it('NO BOOKING:403 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      await createRoomWithHotelId(theHotel.id, { capacity: 2 });

      const response = await server.put('/booking/6').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('NO VACANCY : 403 ERROR', async () => {
      
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      const booking = await createBooking(theRoom.id, user.id);

      const userR = await createUser();
      const romm = await createRoomWithHotelId(theHotel.id, { capacity: 1 });
      await createBooking(romm.id, userR.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .send({ roomId: romm.id })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.FORBIDDEN);

    });


    it('NOT FOUND ROOM : 404 ERROR', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();

      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      const theBooking = await createBooking(theRoom.id, user.id);

      const response = await server
        .put(`/booking/${theBooking.id}`)
        .send({ roomId: theRoom.id + 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);

    });
    it('OK BOOKING : 200 STATUS ', async () => {

      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const theHotel = await createHotel();
      const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
      const booking = await createBooking(theRoom.id, user.id);
      const romm = await createRoomWithHotelId(theHotel.id, { capacity: 1 });

      const response = await server
        .put(`/booking/${booking.id}`)
        .send({ roomId: romm.id })
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);

      const responsetWO = await prisma.booking.findFirst({ where: { userId: user.id } });
      expect(responsetWO.roomId).toBe(romm.id);

    });

  });

});





