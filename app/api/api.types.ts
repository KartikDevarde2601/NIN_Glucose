import { SyncDatabaseChangeSet } from "@nozbe/watermelondb/sync"
export interface LoginResponse {
  token: string
  profile: {
    id: string
    name: string
    email: string
    user_id: string
    doctor_id: string
  }
  user: {
    id: string
    name: string
    email: string
    role: string
    hospital_id: string
  }
}

export interface pullResponse {
  timestamp: number
  changes: SyncDatabaseChangeSet[]
  experimentalStrategy?: boolean
}

export interface pushResponse {
  msg: "success" | "fail"
}

export interface LoginTransformed {
  token: string
  profile: {
    name: string
    email: string
    nurse_id: string
    doctor_id: string
    hospital_id: string
  }
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}
