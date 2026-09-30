import React, { useState, useMemo } from 'react';
import { Product, Category, User } from '../types';
import { storageService } from '../services/storageService';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageManagerModal } from './ImageManagerModal';
import { DEFAULT_FALLBACK_IMAGE } from '../data/imageGallery';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Download,
  X,
  FolderOpen,
  LayoutGrid,
  List,
  Camera,
  Image as ImageIcon,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface ProductsViewProps {
  currentUser: User;
  onNavigateToStock?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ currentUser, onNavigateToStock }) => {
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [categories] = useState<Category[]>(() => storageService.getCategories());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Image Picker & Asset Manager Modals
  const [isFormImagePickerOpen, setIsFormImagePickerOpen] = useState(false);
  const [quickImageEditProduct, setQuickImageEditProduct] = useState<Product | null>(null);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [unit, setUnit] = useState('pcs');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_FALLBACK_IMAGE);

  // Delete modal state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Dynamic Rule Permissions
  const canCreateEdit = storageService.hasPermission(currentUser, 'productsCreateEdit');
  const canDelete = storageService.hasPermission(currentUser, 'productsDelete');

  const refreshData = () => {
    setProducts(storageService.getProducts());
  };

  // Open Add modal
  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setSku(`PRD-${randomSuffix}`);
    setBarcode(`89010300${randomSuffix}`);
    setCategoryId(categories[0]?.id || '');
    setCostPrice('');
    setSellingPrice('');
    setStock('25');
    setMinStockAlert('10');
    setUnit('pcs');
    setSupplier('');
    setDescription('');
    setImageUrl(DEFAULT_FALLBACK_IMAGE);
    setIsModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setCategoryId(prod.categoryId);
    setCostPrice(prod.costPrice.toString());
    setSellingPrice(prod.sellingPrice.toString());
    setStock(prod.stock.toString());
    setMinStockAlert(prod.minStockAlert.toString());
    setUnit(prod.unit || 'pcs');
    setSupplier(prod.supplier || '');
    setDescription(prod.description || '');
    setImageUrl(prod.imageUrl || DEFAULT_FALLBACK_IMAGE);
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !categoryId) return;

    const prodData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || sku.trim(),
      categoryId,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stock: parseInt(stock, 10) || 0,
      minStockAlert: parseInt(minStockAlert, 10) || 10,
      unit: unit.trim() || 'pcs',
      supplier: supplier.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || DEFAULT_FALLBACK_IMAGE,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    storageService.saveProduct(prodData);
    refreshData();
    setIsModalOpen(false);
  };

  // Handle Delete
  const confirmDelete = () => {
    if (!deletingProductId) return;
    storageService.deleteProduct(deletingProductId);
    refreshData();
    setDeletingProductId(null);
  };

  // Quick direct image edit handler
  const handleQuickImageUpdate = (newUrl: string) => {
    if (quickImageEditProduct) {
      storageService.updateProductImage(quickImageEditProduct.id, newUrl);
      refreshData();
      setQuickImageEditProduct(null);
    }
  };

  // Filtered list
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'IN_STOCK') matchesStock = p.stock > p.minStockAlert;
      else if (stockFilter === 'LOW_STOCK') matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
      else if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock <= 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'Barcode', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Unit', 'Supplier', 'Image URL'];
    const rows = filtered.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
      return [p.id, p.sku, p.barcode, `"${p.name}"`, `"${cat}"`, p.costPrice, p.sellingPrice, p.stock, p.unit, `"${p.supplier}"`, `"${p.imageUrl || ''}"`];
    });
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-catalog-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div id="products-view" className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog & Inventory</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {filtered.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product images, barcodes, cost and retail pricing, stock thresholds, and suppliers.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Image Asset Folder Button */}
          <button
            id="btn-open-image-manager"
            onClick={() => setIsImageManagerOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            title="Manage project image folder and assets"
          >
            <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            <span>Image Folder & Assets</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 bg-white rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'TABLE' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'GRID' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid / Photo Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export CSV
          </button>

          {canCreateEdit && (
            <button
              id="btn-add-product"
              onClick={openAddModal}
              className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Product
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product title, SKU, barcode, supplier..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-indigo-600"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:border-indigo-600"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">Adequate Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE: TABLE */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center w-16">Photo</th>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Margin</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No products match your filter</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => {
                    const cat = categories.find((c) => c.id === product.categoryId);
                    const marginPct =
                      product.sellingPrice > 0
                        ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
                        : 0;
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Interactive Photo Thumbnail */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setQuickImageEditProduct(product)}
                            title="Click to edit/change product photo"
                            className="relative w-11 h-11 mx-auto rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group/img focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <img
                              src={product.imageUrl || DEFAULT_FALLBACK_IMAGE}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span>Barcode: {product.barcode}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: cat ? `${cat.color}15` : '#f1f5f9',
                              color: cat?.color || '#475569',
                            }}
                          >
                            {cat?.name || 'Unassigned'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500 font-mono">
                          ${product.costPrice.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono">
                          ${product.sellingPrice.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <span className={`text-[11px] font-semibold ${marginPct >= 30 ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {marginPct}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOutOfStock ? (
                              <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                            ) : isLowStock ? (
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                            ) : null}
                            {product.stock} {product.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                          {product.supplier || '—'}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {canCreateEdit && (
                            <button
                              onClick={() => setQuickImageEditProduct(product)}
                              title="Change Image in Frontend"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canCreateEdit && (
                            <button
                              onClick={() => openEditModal(product)}
                              title="Edit Product Details"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeletingProductId(product.id)}
                              title="Delete Product"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE: PHOTO CARDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query</p>
            </div>
          ) : (
            filtered.map((product) => {
              const cat = categories.find((c) => c.id === product.categoryId);
              const marginPct =
                product.sellingPrice > 0
                  ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)
                  : 0;
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Photo area */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={product.imageUrl || DEFAULT_FALLBACK_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />

                    {/* Category badge */}
                    <span
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs backdrop-blur-xs"
                      style={{
                        backgroundColor: cat ? `${cat.color}EE` : '#0f172aEE',
                        color: '#FFFFFF',
                      }}
                    >
                      {cat?.name || 'Unassigned'}
                    </span>

                    {/* Stock badge */}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                        isOutOfStock
                          ? 'bg-rose-600 text-white'
                          : isLowStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isOutOfStock ? 'Sold Out' : `${product.stock} ${product.unit}`}
                    </span>

                    {/* Quick Edit Photo Button on Hover */}
                    <button
                      type="button"
                      onClick={() => setQuickImageEditProduct(product)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Edit Photo</span>
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                        {product.sku}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">Retail Price</div>
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            ${product.sellingPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Margin</div>
                          <div className="text-xs font-bold text-emerald-600 font-mono">
                            {marginPct}%
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        {canCreateEdit && (
                          <button
                            onClick={() => setQuickImageEditProduct(product)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Photo
                          </button>
                        )}
                        {canCreateEdit && (
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingProductId(product.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingProduct ? 'Edit Product Details' : 'Add New Product'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configure SKU, pricing, inventory thresholds, and frontend image
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              {/* Product Image Selector Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="relative w-18 h-18 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={imageUrl || DEFAULT_FALLBACK_IMAGE}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Product Image (Frontend)
                  </span>
                  <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                    {imageUrl || 'Using default packaging icon'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      id="btn-form-choose-image"
                      onClick={() => setIsFormImagePickerOpen(true)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <FolderOpen className="w-3 h-3" />
                      Browse / Upload Image
                    </button>
                    {imageUrl && imageUrl !== DEFAULT_FALLBACK_IMAGE && (
                      <button
                        type="button"
                        onClick={() => setImageUrl(DEFAULT_FALLBACK_IMAGE)}
                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Organic Ethiopian Cold Brew 330ml"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. BEV-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 890103001201"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="can">Can</option>
                    <option value="bottle">Bottle</option>
                    <option value="bag">Bag</option>
                    <option value="box">Box</option>
                    <option value="jug">Jug</option>
                    <option value="block">Block</option>
                    <option value="pack">Pack</option>
                    <option value="pump">Pump</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Apex Roasters Wholesale LLC"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional item notes or ingredients..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-200 shadow-xl text-xs">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Confirm Product Deletion</h3>
            <p className="text-slate-500 mt-1">
              Are you sure you want to remove this product from the catalog? This action will archive historical pricing.
            </p>
            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Picker for Add/Edit Product Modal */}
      {isFormImagePickerOpen && (
        <ImagePickerModal
          isOpen={isFormImagePickerOpen}
          onClose={() => setIsFormImagePickerOpen(false)}
          currentImageUrl={imageUrl}
          onSelectImage={(newUrl) => setImageUrl(newUrl)}
          title="Select or Upload Product Image"
        />
      )}

      {/* Quick In-Place Image Picker for any Product */}
      {quickImageEditProduct && (
        <ImagePickerModal
          isOpen={Boolean(quickImageEditProduct)}
          onClose={() => setQuickImageEditProduct(null)}
          currentImageUrl={quickImageEditProduct.imageUrl}
          onSelectImage={handleQuickImageUpdate}
          title={`Update Image for: ${quickImageEditProduct.name}`}
        />
      )}

      {/* Full Image Folder & Asset Manager Modal */}
      {isImageManagerOpen && (
        <ImageManagerModal
          isOpen={isImageManagerOpen}
          onClose={() => setIsImageManagerOpen(false)}
          products={products}
          onProductsUpdated={refreshData}
        />
      )}
    </div>
  );
};
