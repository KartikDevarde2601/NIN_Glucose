/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import {ApisauceInstance, create} from 'apisauce';
import type {
  ApiConfig,
  LoginResponse,
  LoginTransformed,
  pullResponse,
  pushResponse,
} from './api.types';
import {GeneralApiProblem, getGeneralApiProblem} from './apiProblem';
import {SyncDatabaseChangeSet} from '@nozbe/watermelondb/sync';
/**
 * Configuring the apisauce instance.
 */

const API_URL = 'http://10.2.216.208/api/';
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: API_URL,
  timeout: 30000,
};

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance;
  config: ApiConfig;

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config;
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  async Login(
    email: string,
    password: string,
  ): Promise<{kind: 'ok'; data: LoginTransformed} | GeneralApiProblem> {
    const response = await this.apisauce.post<LoginResponse>(
      'auth/login',
      {email, password},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) return problem;
    }

    try {
      if (!response.data) {
        return {kind: 'bad-data'};
      }

      const {token, profile, user} = response.data;
      return {
        kind: 'ok',
        data: {
          token,
          profile: {
            name: profile.name,
            email: profile.email,
            nurse_id: profile.id,
            doctor_id: profile.doctor_id,
            hospital_id: user.hospital_id,
          },
        },
      };
    } catch (error) {
      return {kind: 'bad-data'};
    }
  }

  async pull(
    last_pulled_at: number | undefined,
    // token: string,
    isLoginSync: boolean,
  ): Promise<{kind: 'ok'; data: pullResponse} | GeneralApiProblem> {
    try {
      const response = await this.apisauce.get<pullResponse>(
        'sync/push',
        {
          last_pulled_at: last_pulled_at?.toString(),
          isLoginSync: isLoginSync ? 'true' : 'false',
        },
        {
          // headers: {
          //   Authorization: `Bearer ${token}`,
          // },
        },
      );

      if (response.ok && response.data) {
        return {kind: 'ok', data: response.data};
      } else {
        return {kind: 'bad-data'};
      }
    } catch (error) {
      console.error('Network error:', error);
      return {kind: 'unknown', temporary: true};
    }
  }

  async push(
    lastPulledAt: number,
    changes: SyncDatabaseChangeSet,
  ): Promise<{kind: 'ok'; data: {msg: string}} | GeneralApiProblem> {
    try {
      const response = await this.apisauce.post<pushResponse>(
        'sync/pull',
        {changes, lastPulledAt},
        {
          // headers: {
          //   "Content-Type": "application/json",
          //   Authorization: token,
          // },
        },
      );

      if (response.ok && response.data) {
        return {kind: 'ok', data: response.data};
      } else {
        return {kind: 'bad-data'};
      }
    } catch (error) {
      return {kind: 'unknown', temporary: true};
    }
  }
}

// Singleton instance of the API for convenience
export const api = new Api();
