"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CameraStatus,
  FacingMode,
  CameraDevice,
  CameraErrorDetails,
} from "@/types/camera";

export interface UseCameraReturn {
  status: CameraStatus;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  errorDetails: CameraErrorDetails | null;
  facingMode: FacingMode;
  isMirrored: boolean;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  isFullscreen: boolean;
  startCamera: (deviceId?: string) => Promise<boolean>;
  stopCamera: () => void;
  toggleFacingMode: () => Promise<void>;
  toggleMirror: () => void;
  selectDevice: (deviceId: string) => Promise<void>;
  captureSnapshot: (customName?: string) => string | null;
  toggleFullscreen: (targetElement?: HTMLElement | null) => void;
}

export function useCamera(): UseCameraReturn {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorDetails, setErrorDetails] = useState<CameraErrorDetails | null>(
    null
  );
  const [facingMode, setFacingMode] = useState<FacingMode>("user");
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.enumerateDevices
    ) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      setDevices(videoInputs);
    } catch {
      // Ignore enumeration errors until permission granted
    }
  }, []);

  // Teardown any active stream cleanly
  const stopTracks = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  // Stop camera method
  const stopCamera = useCallback(() => {
    stopTracks();
    setStatus("stopped");
  }, [stopTracks]);

  // Start camera method
  const startCamera = useCallback(
    async (targetDeviceId?: string): Promise<boolean> => {
      // 1. Check browser support
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const err: CameraErrorDetails = {
          type: "unsupported",
          message: "Webcam access is not supported by your browser.",
          howToFix:
            "Please use a modern browser such as Chrome, Edge, Firefox, or Safari.",
        };
        setErrorDetails(err);
        setStatus("unsupported");
        return false;
      }

      // Teardown previous tracks before starting new
      stopTracks();
      setStatus("requesting");
      setErrorDetails(null);

      const requestedDevice = targetDeviceId || selectedDeviceId;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: requestedDevice
          ? { deviceId: { exact: requestedDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        activeStreamRef.current = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {
            // Autoplay policy or unmount
          });
        }

        setStatus("active");
        if (targetDeviceId) setSelectedDeviceId(targetDeviceId);
        setIsMirrored(facingMode === "user");

        // Refresh enumerated devices now that label access is granted
        await refreshDevices();
        return true;
      } catch (error: any) {
        stopTracks();
        let errType: CameraStatus = "error";
        let message = error.message || "An error occurred accessing the camera.";
        let howToFix = "Check your camera connection and try again.";

        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          errType = "permission_denied";
          message = "Camera access was denied by your browser or system.";
          howToFix =
            "Click the lock/camera icon in your browser URL bar, allow Camera access for this site, and reload the page.";
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          errType = "no_camera";
          message = "No webcam device was detected on your system.";
          howToFix =
            "Ensure an external USB webcam is plugged in or built-in camera is enabled in device manager.";
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          errType = "camera_busy";
          message = "Camera is already in use by another application.";
          howToFix =
            "Close other apps using your webcam (Zoom, Teams, Discord, OBS, or other browser tabs) and retry.";
        }

        const details: CameraErrorDetails = {
          type: errType,
          message,
          howToFix,
        };

        setErrorDetails(details);
        setStatus(errType);
        return false;
      }
    },
    [facingMode, selectedDeviceId, stopTracks, refreshDevices]
  );

  // Toggle facing mode (Front / Back)
  const toggleFacingMode = useCallback(async () => {
    const nextMode: FacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    setSelectedDeviceId(null); // Clear specific device ID to allow facingMode constraint
    if (status === "active") {
      // Re-trigger start with updated mode
      setIsMirrored(nextMode === "user");
      // Short delay to ensure state
      setTimeout(() => {
        startCamera();
      }, 50);
    }
  }, [facingMode, status, startCamera]);

  // Select a specific device ID
  const selectDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (status === "active") {
        await startCamera(deviceId);
      }
    },
    [status, startCamera]
  );

  // Toggle mirror display
  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  // Capture frame as local PNG download
  const captureSnapshot = useCallback(
    (customName?: string): string | null => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");

        // Trigger safe local client download
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = dataUrl;
        a.download = `${customName || "gestura-frame"}-${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        return dataUrl;
      } catch (err) {
        console.error("Frame snapshot error:", err);
        return null;
      }
    },
    [isMirrored]
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(
    (targetElement?: HTMLElement | null) => {
      if (typeof document === "undefined") return;

      const element = targetElement || videoRef.current?.parentElement;
      if (!element) return;

      if (!document.fullscreenElement) {
        element.requestFullscreen?.().then(() => {
          setIsFullscreen(true);
        }).catch(() => {});
      } else {
        document.exitFullscreen?.().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    },
    []
  );

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Cleanup on unmount - ensures no camera streams or tracks leak
  useEffect(() => {
    refreshDevices();
    return () => {
      stopTracks();
    };
  }, [refreshDevices, stopTracks]);

  return {
    status,
    stream,
    videoRef,
    errorDetails,
    facingMode,
    isMirrored,
    devices,
    selectedDeviceId,
    isFullscreen,
    startCamera,
    stopCamera,
    toggleFacingMode,
    toggleMirror,
    selectDevice,
    captureSnapshot,
    toggleFullscreen,
  };
}
