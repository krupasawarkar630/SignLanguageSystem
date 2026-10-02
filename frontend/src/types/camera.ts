export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "paused"
  | "stopped"
  | "permission_denied"
  | "no_camera"
  | "camera_busy"
  | "unsupported"
  | "error";

export type FacingMode = "user" | "environment";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CameraErrorDetails {
  type: CameraStatus;
  message: string;
  howToFix: string;
}
