'use client';

import { useState } from 'react';
import { 
  X, Download, Eye, ZoomIn, Upload, Trash2, 
  ChevronLeft, ChevronRight, Image as ImageIcon 
} from 'lucide-react';

interface EventImage {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface EventImageGalleryProps {
  images: EventImage[];
  onImagesChange: (images: EventImage[]) => void;
  editable?: boolean;
  maxImages?: number;
}

export default function EventImageGallery({ 
  images, 
  onImagesChange, 
  editable = false, 
  maxImages = 10 
}: EventImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check max images limit
    if (images.length + files.length > maxImages) {
      window.toast.warning(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return allowedTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length === 0) {
      window.toast.warning('Please select valid image files (JPEG, PNG, GIF, WebP) under 10MB');
      return;
    }

    // Create new image objects
    const newImages: EventImage[] = validFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(),
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      // Revoke object URL to prevent memory leaks
      const imageToDelete = images.find(img => img.id === imageId);
      if (imageToDelete && imageToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.url);
      }
      
      onImagesChange(images.filter(img => img.id !== imageId));
      
      // Adjust selected index if necessary
      if (selectedImageIndex >= images.length - 1) {
        setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
      }
    }
  };

  const handleDownloadImage = (image: EventImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
    } else {
      setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Yet</h3>
        <p className="text-gray-600">Upload reference images for your events</p>
        {editable && (
          <div className="mt-4">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex];

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Main Image Display */}
        <div className="relative mb-4">
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-full h-full object-contain cursor-pointer"
              onClick={() => setShowFullscreen(true)}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            
            {/* Image Actions */}
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => setShowFullscreen(true)}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                title="View Fullscreen"
              >
                <Eye className="w-4 h-4" />
              </button>
              {editable && (
                <button
                  onClick={() => handleDeleteImage(selectedImage.id)}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-100"
                  title="Delete Image"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </div>

          {/* Image Counter */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <span>{selectedImageIndex + 1} / {images.length}</span>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`flex-shrink-0 cursor-pointer transition-all ${
                index === selectedImageIndex
                  ? 'ring-2 ring-blue-500'
                  : 'opacity-70 hover:opacity-100'
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-2">{selectedImage.name}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Size:</span> {formatFileSize(selectedImage.size)}
          </div>
          <div>
            <span className="font-medium">Type:</span> {selectedImage.type}
          </div>
          <div>
            <span className="font-medium">Uploaded:</span> {new Date(selectedImage.uploadedAt).toLocaleString()}
          </div>
        </div>
        
        {editable && (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => handleDownloadImage(selectedImage)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={() => handleDeleteImage(selectedImage.id)}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Upload Area */}
      {editable && images.length < maxImages && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Reference Images</h3>
              <p className="text-gray-600 mb-4">
                Add images to reference during your events
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: JPEG, PNG, GIF, WebP (Max 10MB)
              </p>
              <div className="text-sm text-gray-500">
                {images.length} / {maxImages} images uploaded
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </label>
        </div>
      )}

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-[90vh]">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
