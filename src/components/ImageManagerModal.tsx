import React, { useState } from 'react';
import { LOCAL_PRODUCT_IMAGES, CURATED_ONLINE_IMAGES, DEFAULT_FALLBACK_IMAGE } from '../data/imageGallery';
import { Product } from '../types';
import { storageService } from '../services/storageService';
import {
  FolderOpen,
  Upload,
  Sparkles,
  Check,
  X,
  Plus,
  Package,
  ArrowRight,
  Search,
  ExternalLink,
  Edit3,
} from 'lucide-react';

interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdated: () => void;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductsUpdated,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(LOCAL_PRODUCT_IMAGES[0].url);
  const [assigningToProductId, setAssigningToProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUploads, setCustomUploads] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomUploads((prev) => [dataUrl, ...prev]);
        setSelectedImage(dataUrl);
        showNotice('New image uploaded to frontend library!');
      }
    };
    reader.readAsDataURL(file);
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAssignImage = (productId: string, imgUrl: string) => {
    storageService.updateProductImage(productId, imgUrl);
    onProductsUpdated();
    const prod = products.find((p) => p.id === productId);
    showNotice(`Assigned image to "${prod?.name || 'product'}"!`);
  };

  const allAvailableImages = [
    ...customUploads.map((url, idx) => ({
      id: `custom-${idx}`,
      name: `Custom Upload #${idx + 1}`,
      category: 'Custom Uploads',
      url,
      isLocal: true,
    })),
    ...LOCAL_PRODUCT_IMAGES,
    ...CURATED_ONLINE_IMAGES,
  ];

  const filteredImages = allAvailableImages.filter((img) => {
    if (filterCategory !== 'ALL' && img.category !== filterCategory) return false;
    if (searchQuery && !img.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Find products currently using the selected image
  const productsUsingSelectedImage = products.filter(
    (p) => (p.imageUrl || DEFAULT_FALLBACK_IMAGE) === selectedImage
  );

  return (
    <div
      id="image-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Product Image Folder & Asset Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {allAvailableImages.length} Assets
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Explore local <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.2 rounded">/public/images/products/</code> assets, upload new photos, and map them to products in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload New Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification banner if any */}
        {notification && (
          <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Layout: Left is Image Grid, Right is Image Details & Assignment */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Gallery Grid */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50/50">
            {/* Filter Bar */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter images by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {['ALL', 'Custom Uploads', 'Beverages', 'Snacks', 'Dairy', 'Electronics', 'Personal Care'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all whitespace-nowrap ${
                      filterCategory === c
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Images */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredImages.map((img) => {
                const isSelected = selectedImage === img.url;
                const assignedCount = products.filter((p) => p.imageUrl === img.url).length;

                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`group cursor-pointer rounded-xl border p-2 flex flex-col bg-white transition-all text-left relative ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center border border-slate-100">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {assignedCount > 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Used by {assignedCount}
                        </span>
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-white/90 text-slate-700 text-[9px] font-mono px-1 py-0.2 rounded shadow-2xs">
                        {img.url.startsWith('data:')
                          ? 'UPLOAD'
                          : img.url.endsWith('.svg')
                          ? 'SVG'
                          : img.url.endsWith('.jpg')
                          ? 'JPG'
                          : 'CDN'}
                      </span>
                    </div>

                    <div className="mt-2 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {img.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {img.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Image Details & Quick Assign */}
          <div className="w-full md:w-80 border-t md:border-t-0 bg-white p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Selected Image Details
              </h3>

              {/* Large Image Preview */}
              <div className="w-full aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner relative">
                <img
                  src={selectedImage}
                  alt="Selected Preview"
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Path & Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    File Location / URL
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 break-all select-all mt-0.5">
                    {selectedImage.startsWith('data:') ? 'Data URL (Base64 in Frontend Memory)' : selectedImage}
                  </p>
                </div>
              </div>

              {/* 1-Click Assign to Product */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Assign this image to a product:
                </label>
                <div className="flex gap-2">
                  <select
                    value={assigningToProductId}
                    onChange={(e) => setAssigningToProductId(e.target.value)}
                    className="flex-1 text-xs py-2 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!assigningToProductId}
                    onClick={() => {
                      if (assigningToProductId) {
                        handleAssignImage(assigningToProductId, selectedImage);
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Apply
                  </button>
                </div>
              </div>

              {/* Products Currently Using this image */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Products using this image ({productsUsingSelectedImage.length}):
                </span>
                {productsUsingSelectedImage.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No products currently use this asset.</p>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {productsUsingSelectedImage.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.sku}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close Asset Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
