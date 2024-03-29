import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Firestore } from 'firebase-admin/firestore';
@Injectable()
export class AdministrationService {
  constructor(
    private readonly httpService: HttpService,
    @Inject('FirestoreAdmin') private readonly firestore: Firestore,
  ) {}

  private readonly logger = new Logger(AdministrationService.name);

  //Fetch athlete data from Strava with accesstoken currently from env file
  public async athleteData(req): Promise<String> {
    await this.refreshAccessToken(req);
    const userRef = this.firestore
      .collection('administration-service')
      .doc(req.user.uid);

    const user = await this.getUser(userRef);

    const stravaAthleteUrl = `https://www.strava.com/api/v3/athlete/activities?per_page=30`;
    const dataAthlete = await firstValueFrom(
      this.httpService
        .get(stravaAthleteUrl, {
          headers: {
            accept: `application/json`,
            Authorization: `Bearer ${user.data().stravaAccessToken}`,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error('status' + error.response.status);
            this.logger.error(error.response.data);
            throw 'An athlete error happened!';
          }),
        ),
    );
    return dataAthlete.data;
  }

  //Disconnects the user from Strava & deletes the user + Strava tokens from administration database
  async disconnectStrava(req: any): Promise<String> {
    const userRef = this.firestore
      .collection('administration-service')
      .doc(req.user.uid);

    const user = await this.getUser(userRef);

    const deauthUrl = `https://www.strava.com/oauth/deauthorize?access_token=${
      user.data().stravaAccessToken
    }`;

    this.httpService.post(deauthUrl).pipe(
      catchError((error: AxiosError) => {
        this.logger.error('status' + error.response.status);
        this.logger.error(error.response.data);
        throw new HttpException(
          'Deauthorization with Strava failed',
          HttpStatus.UNAUTHORIZED,
        );
      }),
    );
    await userRef.delete().catch((error) => {
      this.logger.error(error);
      throw new HttpException(
        'Deleting User from Administration DB failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
    return 'Strava disconnected';
  }

  //Authenticates the user with Strava (receives access token & refresh token)
  public async stravaAuth(queryParams: any, req: any): Promise<String> {
    const authUrl = `https://www.strava.com/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${queryParams.code}&grant_type=authorization_code`;
    if ('error' in queryParams && queryParams.error === 'access_denied') {
      return 'Connection to Strava failed. Please try again';
    }

    const authData = await firstValueFrom(
      this.httpService.post(authUrl).pipe(
        catchError((error: AxiosError) => {
          this.logger.error('status' + error.response.status);
          this.logger.error(error.response.data);
          throw new HttpException(
            'Auth failed, please try again',
            HttpStatus.UNAUTHORIZED,
          );
        }),
      ),
    );

    const userRef = this.firestore
      .collection('administration-service')
      .doc(req.user.uid);

    await userRef
      .set({
        athleteId: authData.data.athlete.id,
        stravaAccessToken: authData.data.access_token,
        accessTokenExpiresAt: authData.data.expires_at,
        stravaRefreshToken: authData.data.refresh_token,
      })
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          'Presisting token failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    this.logger.log(`User ${req.user.sub} connected to Strava`);
    return authData.data.athlete.id;
  }

  //Refreshes the access token (should be called before every request to Strava)
  public async refreshAccessToken(req: any): Promise<String> {
    const userRef = this.firestore
      .collection('administration-service')
      .doc(req.user.uid);

    const user = await this.getUser(userRef);

    const stravaRefreshUrl = `https://www.strava.com/oauth/token?client_id=${
      process.env.CLIENT_ID
    }&client_secret=${process.env.CLIENT_SECRET}&refresh_token=${
      user.data().refresh_token
    }&grant_type=refresh_token`;

    if (user.data().accessTokenExpiresAt < Date.now() / 1000) {
      let refreshToken = await firstValueFrom(
        this.httpService.post(stravaRefreshUrl).pipe(
          catchError((error: AxiosError) => {
            this.logger.error('status' + error.response.status);
            this.logger.error(error.response.data);
            throw new HttpException(
              'Auth failed, please try again',
              HttpStatus.UNAUTHORIZED,
            );
          }),
        ),
      );

      await userRef
        .update({
          stravaAccessToken: refreshToken.data.access_token,
          accessTokenExpiresAt: refreshToken.data.expires_at,
        })
        .catch((error) => {
          this.logger.error(error);
          throw new HttpException(
            'Refreshing token failed',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
    }
    return 'Token refreshed';
  }

  public async getStravaId(req: any): Promise<String> {
    const userRef = this.firestore
      .collection('administration-service')
      .doc(req.user.uid);

    let id = '';
    await this.getUser(userRef)
      .then((user) => {
        if (user.data() !== undefined) {
          id = user.data().athleteId;
        } else {
          id = null;
        }
      })
      .catch((error) => {
        this.logger.error('Error while getting athleteId: ' + error);
        throw error;
      });
    return id;
  }

  private async getUser(userRef: any) {
    return await userRef.get().catch((error) => {
      this.logger.error(error);
      throw new HttpException(
        `Couldn't get data`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  public async hello(userId: string, tenantId: String): Promise<String> {
    return `Hello! I am the analysis administration.\nYour userId is: ${userId}\nYour tenantId is: ${tenantId}\n`;
  }

  public async getTheme(tenant: string): Promise<String> {
    const docRef = this.firestore
      .collection('administration-themes')
      .doc(tenant);

    const doc = await this.getUser(docRef);

    if (doc.data() !== undefined) {
      return doc.data().customColor;
    } else {
      return '#48A9A6';
    }
  }

  public async setTheme(tenant: string, color: string): Promise<Boolean> {
    const docRef = this.firestore
      .collection('administration-themes')
      .doc(tenant.toLowerCase());

    await docRef
      .set({
        customColor: color,
      })
      .catch((error) => {
        this.logger.error(error);
        throw new HttpException(
          'Setting theme color failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    this.logger.log('Set theme color for tenant ' + tenant + ' to ' + color);
    return true;
  }
}
