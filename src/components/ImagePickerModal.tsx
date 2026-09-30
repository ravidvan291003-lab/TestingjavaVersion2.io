import React, { useState, useRef } from 'react';
import { LOCAL_PRODUCT_IMAGES, CURATED_ONLINE_IMAGES, PresetImage, DEFAULT_FALLBACK_IMAGE } from '../data/imageGallery';
import {
  Image as ImageIcon,
  Upload,
  Link,
  FolderOpen,
  Check,
  X,
  Trash2,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  onSelectImage: (newUrl: string) => void;
  title?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl = '',
  onSelectImage,
  title = 'Select or Upload Product Image',
}) => {
  const [activeTab, setActiveTab] = useState<'FOLDER' | 'UPLOAD' | 'URL' | 'ONLINE'>('FOLDER');
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl);
  const [inputUrl, setInputUrl] = useState<string>(currentImageUrl.startsWith('http') ? currentImageUrl : '');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter local images
  const filteredLocal = LOCAL_PRODUCT_IMAGES.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const categories = ['ALL', 'Beverages', 'Snacks', 'Dairy', 'Electronics', 'Personal Care', 'General'];

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP, etc.)');
      return;
    }

    // Limit to 4MB for localStorage stability
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Image file exceeds 4MB size limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedUrl(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (activeTab === 'URL' && inputUrl.trim()) {
      onSelectImage(inputUrl.trim());
    } else {
      onSelectImage(selectedUrl || DEFAULT_FALLBACK_IMAGE);
    }
    onClose();
  };

  return (
    <div
      id="image-picker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">
                Browse project image folder, upload a custom photo, or link an image URL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex gap-4 overflow-x-auto text-xs font-semibold">
          <button
            id="image-tab-folder"
            onClick={() => setActiveTab('FOLDER')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors relative whitespace-nowrap ${
              activeTab === 'FOLDER' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Local Folder Assets ({LOCAL_PRODUCT_IMAGES.length})
            {activeTab === 'FOLDER' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            id="image-tab-upload"
            onClick={() => setActiveTab('UPLOAD')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors relative whitespace-nowrap ${
              activeTab === 'UPLOAD' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload from Computer
            {activeTab === 'UPLOAD' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            id="image-tab-url"
            onClick={() => setActiveTab('URL')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors relative whitespace-nowrap ${
              activeTab === 'URL' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" />
            Web Image URL
            {activeTab === 'URL' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            id="image-tab-online"
            onClick={() => setActiveTab('ONLINE')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors relative whitespace-nowrap ${
              activeTab === 'ONLINE' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Stock Photo Presets ({CURATED_ONLINE_IMAGES.length})
            {activeTab === 'ONLINE' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[480px]">
          {/* TAB 1: LOCAL FOLDER ASSETS */}
          {activeTab === 'FOLDER' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs text-slate-500">
                  Select from <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">/public/images/products/</code>:
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredLocal.map((item) => {
                  const isSelected = selectedUrl === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedUrl(item.url)}
                      className={`group relative rounded-xl border p-2 flex flex-col text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500 ring-offset-1'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center border border-slate-100">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/70 text-white px-1.5 py-0.2 rounded font-mono">
                          {item.url.endsWith('.svg') ? 'SVG' : 'JPG'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {item.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FROM COMPUTER */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/60'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop photo here
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Supports PNG, JPG, WebP, SVG. Stored directly in browser application storage for instant live preview.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-4 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-50"
                >
                  Choose Image File
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEB IMAGE URL */}
          {activeTab === 'URL' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  External Image URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      placeholder="https://example.com/images/product.jpg"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        setSelectedUrl(e.target.value);
                      }}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUrl(inputUrl)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Preview
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Paste any direct link to a product image from Unsplash, Shopify, Imgur, or your CDN.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: STOCK PHOTO PRESETS */}
          {activeTab === 'ONLINE' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Curated high-resolution royalty-free product photos:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CURATED_ONLINE_IMAGES.map((item) => {
                  const isSelected = selectedUrl === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedUrl(item.url)}
                      className={`group relative rounded-xl border p-2 flex flex-col text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg bg-slate-100 overflow-hidden relative border border-slate-100">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-800 line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Preview Box */}
          <div className="pt-4 border-t border-slate-200 flex items-center gap-4 bg-slate-50/70 p-3.5 rounded-xl border">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {selectedUrl ? (
                <img
                  src={selectedUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Selected Image Preview</span>
                {selectedUrl && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                    Ready to Apply
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                {selectedUrl || 'No image chosen (will use default box icon)'}
              </div>
            </div>
            {selectedUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUrl(DEFAULT_FALLBACK_IMAGE);
                  setInputUrl('');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset to default image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="confirm-apply-image-btn"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Image to Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
