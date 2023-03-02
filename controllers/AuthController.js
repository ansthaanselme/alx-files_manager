import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(request, response) {
    const authHeaderVal = request.get('Authorization');
    if (authHeaderVal === undefined) {
      response.status(401).json({
        error: 'Unauthorized'
      });
      return;
    }
    const emailPwdB64 = authHeaderVal.split(' ')[1];

    const emailPwdCombo = Buffer.from(emailPwdB64, 'base64')
      .toString('utf-8');

    const credObj = {};
    emailPwdCombo.split(':').forEach((field) => {
      if (credObj.email === undefined) credObj.email = field;
      else if (credObj.password === undefined) credObj.password = field;
      else credObj.password = [credObj.password, field].join(':');
    });

    credObj.password = sha1(credObj.password);

    const userIs = await dbClient.database.collection('users').findOne(
      credObj,
    );
    if (userIs === null) {
      response.status(401).json({
        error: 'Unauthorized'
      }, );
    } else {
      const tokenFor24H = uuidv4();
      await redisClient.set(`auth_${tokenFor24H}`, userIs._id, 24 * 3600);
      response.status(200).json({
        token: tokenFor24H
      }, );
    }
  }


  static async getDisconnect(request, response) {
    const token = request.get('X-Token');
    if (token === undefined) response.status(401).json({
      error: 'Unauthorized'
    });
    else {
      await redisClient.del(`auth_${token}`);
      response.status(204).send();
    }
  }
}
