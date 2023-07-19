
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import * as jwt from 'jsonwebtoken'
import { cleanDb , generateValidToken } from "../helpers";
import app, {init} from "@/app";
import { TicketStatus } from "@prisma/client";
import { createEnrollmentWithAddress , createHotel , createPayment , createTicket, createTicketTypeWithHotel , createTicketTypeRemote,
 createRoomWithHotelId, createUser, booking } from "../factories";




beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });
  
  const server = supertest(app);



  describe('POST /booking', () => {

    it('NO TOKEN: 402 ERROR', async () => {

      const response = await server.post('/booking');
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });
  
    it('NO VALID TOKE: 401 ERROR', async () => {

      const token = faker.lorem.word(); 
  
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });
  
    it('NO SESSION PER TOKEN: 401 ERROR', async () => {

      const user = await createUser();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });


  
    describe('VALID TOKEN', () => {

      it('REMOTE TICKET : 403 STATUS ', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
  
        const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);

      });
  
      it('NOT PAID : 403 STATUS ', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
  
        const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);

      });
  
      it('NO ENRROLMENT: 403 STATUS ', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
  
        const response = await server.post('/booking').send({ roomId: 0 }).set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);

      });

  
      it('NOT FOUND: 404 ERROR ', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();

        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await prisma.room.findMany({});
        const response = await server.post('/booking').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);
  

        expect(response.status).toEqual(httpStatus.NOT_FOUND);

      });
  
      it('NO VACACIES PER ROOM: 403 ERROR ', async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const theHotel = await createHotel();
  
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
        const theUser = await createUser();
        await booking(theRoom.id, theUser.id);   
        await booking(theRoom.id, theUser.id);
  
        const response = await server.post('/booking').send({ roomId: theRoom.id }).set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);

      });
  
      it('ITS OK ; 200 STATUS', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

        const theHotel = await createHotel();
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 1 });
  
        const response = await server.post('/booking').send({ roomId: theRoom.id }).set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.OK);

        const booking = await prisma.booking.findFirst();
        expect(booking.id).toBe(response.body.bookingId);

      });

    });

  });



  
  describe('GET /booking', () => {

    it('NO TOKEN: 401 ERROR', async () => {

      const response = await server.get('/booking');
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });
  
    it('NOT VALID TOKEN : 402 ERROR', async () => {

      const token = faker.lorem.word();
  
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });
  
    it('NO SESSION PER TOKEN : 402 ERROR', async () => {

      const user = await createUser();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });


  
    describe('VALID TOKEN', () => {

      it('NO ENRROLMENT: 404 ERROR', async () => {

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

      it('NO BOOKING: 404 ERROR', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();

        await createTicket(enrollment.id, ticketType.id, 'PAID');
  
        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND);

      });

      it('ITS OK : 200 STATUS', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();

        await createTicket(enrollment.id, ticketType.id, 'PAID');

        const theHotel = await createHotel(); 
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
        const oo = await booking(theRoom.id, user.id);
  
        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual({

          id: oo.id,
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
  
    it('NOT VALID TOKEN : 401 ERROR', async () => {

      const token = faker.lorem.word();
      const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });
  
    it('NO SESSION FOR TOKEN : 401 ERROR', async () => {

      const user = await createUser();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);

    });

    

    describe('VALID TOKEN', () => {

      it('INVALID : 400 STATUS', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();

        await createTicket(enrollment.id, ticketType.id, 'PAID');

        const theHotel = await createHotel();
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });

        await booking(theRoom.id, user.id);
  
        const response = await server.put('/booking/6').send({}).set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.BAD_REQUEST);

      });


  
      it('NO ENRROLMENT : 403 ERROR', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const response = await server.put('/booking/6').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);

      });
  
      it('NO TICKETS : 401 ERROR', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
  
        const response = await server.put('/booking/6').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.FORBIDDEN);

      });
  
      it('NO BOOKING : 403 ERROR', async () => {

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
  
      it('FULL ROOOM : 403 ERROR', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, 'PAID');
        const theHotel = await createHotel();
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
        const oo = await booking(theRoom.id, user.id);
  
        const otherUser = await createUser();
        const reserv = await createRoomWithHotelId(theHotel.id, { capacity: 1 });
        await booking(reserv.id, otherUser.id);
  
        const response = await server
          .put(`/booking/${oo.id}`)
          .send({ roomId: reserv.id })
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
        const oo = await booking(theRoom.id, user.id);
        const response = await server
          .put(`/booking/${oo.id}`)
          .send({ roomId: theRoom.id + 1 })
          .set('Authorization', `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);

      });
  
      it('ITS OK : 200 STATUS ', async () => {

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();

        await createTicket(enrollment.id, ticketType.id, 'PAID');

        const theHotel = await createHotel();
        const theRoom = await createRoomWithHotelId(theHotel.id, { capacity: 2 });
        const oo = await booking(theRoom.id, user.id);
        const clientRoom = await createRoomWithHotelId(theHotel.id, { capacity: 1 });
  
        const response = await server
          .put(`/booking/${oo.id}`) 
          .send({ roomId: clientRoom.id })
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.OK);

        const reserv = await prisma.booking.findFirst({ where: { userId: user.id } });
        expect(reserv.roomId).toBe(clientRoom.id);

      });

    }); 

  });

  
 