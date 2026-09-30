import React, { useState, useMemo } from 'react';
import { Category, Product, User } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Edit2, Trash2, Tag, FolderTree, Package, X, AlertCircle } from 'lucide-react';

interface CategoriesViewProps {
  currentUser: User;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>(() => storageService.getCategories());
  const [products] = useState<Product[]>(() => storageService.getProducts());

  // Dynamic Rule Permissions
  const canManageCategories = storageService.hasPermission(currentUser, 'categoriesManage');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  // Deleting error state
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const refreshData = () => {
    setCategories(storageService.getCategories());
  };

  // Compute category statistics
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const linkedProducts = products.filter((p) => p.categoryId === cat.id);
      const totalUnits = linkedProducts.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = linkedProducts.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
      return {
        ...cat,
        productCount: linkedProducts.length,
        totalUnits,
        totalValue,
      };
    });
  }, [categories, products]);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setCode('');
    setDescription('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || '');
    setColor(cat.color || '#3B82F6');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const catData: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      color,
    };

    storageService.saveCategory(catData);
    refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = (catId: string) => {
    const linked = products.filter((p) => p.categoryId === catId);
    if (linked.length > 0) {
      setDeleteWarning(
        `Cannot delete this category because it contains ${linked.length} active products. Please reassign or delete those products first.`
      );
      return;
    }
    storageService.deleteCategory(catId);
    refreshData();
  };

  return (
    <div id="categories-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize products into distinct departments, manage taxonomy codes, and track category inventory value.
          </p>
        </div>
        {canManageCategories && (
          <button
            id="btn-add-category"
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Category
          </button>
        )}
      </div>

      {deleteWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{deleteWarning}</div>
          <button onClick={() => setDeleteWarning(null)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryStats.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                      Code: {cat.code}
                    </span>
                  </div>
                </div>
                {canManageCategories && (
                  <div className="flex space-x-1 text-slate-400">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">
                {cat.description || 'No detailed description provided.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Products</span>
                <span className="font-bold text-slate-800 text-xs">{cat.productCount}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Units in Stock</span>
                <span className="font-bold text-slate-800 text-xs">{cat.totalUnits}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Retail</span>
                <span className="font-bold text-indigo-600 text-xs">${cat.totalValue.toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Frozen Foods"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Code (Short prefix) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. FRZ"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Color Tag Accent</label>
                <div className="flex items-center space-x-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-110 border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Items or specifications for this department..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
