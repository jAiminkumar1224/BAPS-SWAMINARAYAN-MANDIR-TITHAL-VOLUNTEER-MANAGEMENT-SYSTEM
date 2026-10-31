import React, { useState, useRef, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, RotateCw, ZoomIn, Check, X } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (compressedBlob: Blob, previewUrl: string) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCapturingWebcam, setIsCapturingWebcam] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle standard file selection (gallery or camera on mobile)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        stopWebcam();
      });
      reader.readAsDataURL(file);
    }
  };

  // Start Webcam for Desktop / Live camera
  const startWebcam = async () => {
    try {
      setIsCapturingWebcam(true);
      setImageSrc(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error opening webcam:', err);
      alert('કેમેરા શરૂ કરવામાં મુશ્કેલી આવી છે. કૃપા કરીને બ્રાઉઝર પરવાનગી તપાસો અથવા ફોટો પસંદ કરો વિકલ્પ વાપરો.');
      setIsCapturingWebcam(false);
    }
  };

  // Stop Webcam stream
  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturingWebcam(false);
  };

  // Capture snapshot from webcam
  const captureWebcamSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImageSrc(dataUrl);
        stopWebcam();
      }
    }
  };

  // Generate cropped image from canvas
  const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    // Canvas size equals cropped pixel box
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw rotated/cropped region
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  // Finalize Crop and Compress
  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const rawBlob = await createCroppedImage(imageSrc, croppedAreaPixels, rotation);
      const rawFile = new File([rawBlob], 'volunteer_photo.jpg', { type: 'image/jpeg' });

      // Client-side compression
      const compressionOptions = {
        maxSizeMB: 0.3, // ~300KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      const compressedFile = await imageCompression(rawFile, compressionOptions);
      const previewUrl = URL.createObjectURL(compressedFile);

      onCropComplete(compressedFile, previewUrl);
      handleClose();
    } catch (err) {
      console.error('Error cropping/compressing photo:', err);
      alert('ફોટો પ્રોસેસ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopWebcam();
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-200" />
            સ્વયંસેવક ફોટો અપલોડ અને ક્રોપ
          </h3>
          <button
            onClick={handleClose}
            className="text-amber-100 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Action Choice Buttons when no image is loaded */}
          {!imageSrc && !isCapturingWebcam && (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-600 hover:bg-amber-50/50 transition cursor-pointer text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-3 group-hover:scale-110 transition">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800 text-base">ફોટો પસંદ કરો</span>
                  <span className="text-xs text-slate-500 mt-1">ગેલેરી અથવા ફાઇલમાંથી અપલોડ કરો</span>
                </button>

                <button
                  type="button"
                  onClick={startWebcam}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-600 hover:bg-amber-50/50 transition cursor-pointer text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-3 group-hover:scale-110 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800 text-base">કેમેરાથી ફોટો લો</span>
                  <span className="text-xs text-slate-500 mt-1">વેબકેમ અથવા મોબાઈલ કેમેરા વાપરો</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-2">
                સપોર્ટેડ ફોર્મેટ: JPG, JPEG, PNG, WEBP (ઓટો-કોમ્પ્રેસ ~300KB)
              </p>
            </div>
          )}

          {/* Live Webcam Stream */}
          {isCapturingWebcam && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={captureWebcamSnapshot}
                  className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-5 h-5" />
                  ફોટો પાડો (Capture)
                </button>
                <button
                  type="button"
                  onClick={stopWebcam}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
                >
                  રદ કરો
                </button>
              </div>
            </div>
          )}

          {/* Cropper View */}
          {imageSrc && (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={3 / 4} // Portrait ID Card Photo Ratio
                  onCropChange={onCropChange}
                  onZoomChange={onZoomChange}
                  onCropComplete={onCropAreaComplete}
                />
              </div>

              {/* Cropper Controls */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-4 h-4 text-amber-700" /> ઝૂમ (Zoom):
                  </span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
                />

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-700" />
                    રોટેટ કરો (Rotate)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    બીજો ફોટો પસંદ કરો
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {imageSrc && (
          <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-200 font-semibold text-sm transition"
            >
              રદ કરો
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isProcessing}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-bold text-sm shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  સેવ થાય છે...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  ફોટો નક્કી કરો
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
