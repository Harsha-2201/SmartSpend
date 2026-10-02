import React, { useState } from 'react';
import { Category } from '../types';
import { Tag, Plus, Check, ShieldCheck, UserCheck } from 'lucide-react';

interface CategoriesViewProps {
  currentUserId: number;
  categories: Category[];
  onAddCategory: (categoryName: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  currentUserId,
  categories,
  onAddCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Available categories for this user: global default (userId == null) + user's custom (userId == currentUserId)
  const availableCategories = categories.filter(
    c => c.userId === null || c.userId === currentUserId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    // Check duplicate
    const exists = availableCategories.some(
      c => c.categoryName.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setMsg({ text: `Category "${trimmed}" already exists.`, error: true });
      return;
    }

    onAddCategory(trimmed);
    setNewCatName('');
    setMsg({ text: `Custom category "${trimmed}" created successfully!` });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl border flex items-center gap-2 shadow-xs ${
          msg.error 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {msg.error ? <Tag className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Expense Categories</h2>
        <p className="text-xs text-slate-600">
          Manage system-wide default categories and your personal custom classifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add Category Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Add Custom Category</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Subscriptions, Pet Care, Fitness"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-600 mt-1">
                Custom categories are automatically linked to your personal account and kept private.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Available Expense Categories</h3>
              <p className="text-xs text-slate-600">Loaded dynamically from database into expense forms</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {availableCategories.length} Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Scope / Ownership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {availableCategories.map((c) => (
                  <tr key={c.categoryId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 font-semibold">
                      #{c.categoryId}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {c.categoryName}
                    </td>
                    <td className="py-3 px-4">
                      {c.userId === null ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          <ShieldCheck className="w-3 h-3 text-slate-600" />
                          Default (System-wide)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <UserCheck className="w-3 h-3 text-amber-600" />
                          Custom (Personal)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
