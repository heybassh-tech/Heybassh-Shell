import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Product } from "../types";
import { PrimaryModal } from "../../PrimaryModal";
import { PrimaryButton } from "../../PrimaryButton";
import { PrimaryInput } from "../../PrimaryInput";

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
}

export function Products({ products, onAddProduct }: ProductsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({ 
    sku: "",
    name: "", 
    category: "General", 
    price: 0,
    stock: 0
  });

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const categories = ["All", ...new Set(localProducts.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return localProducts.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [localProducts, searchTerm, categoryFilter]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setLocalProducts((prev) =>
        prev.map((p) => (p.sku === newProduct.sku ? { ...p, ...newProduct } as Product : p)),
      );
    } else {
      onAddProduct(newProduct);
      setLocalProducts((prev) => [...prev, { ...newProduct, id: crypto.randomUUID() } as Product]);
    }
    setNewProduct({ 
      sku: "",
      name: "", 
      category: "General", 
      price: 0,
      stock: 0
    });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setNewProduct({ sku: "", name: "", category: "General", price: 0, stock: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setIsEditing(true);
    setNewProduct({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h2 className="text-2xl font-bold text-[#18aead]">Products</h2>
        <div className="flex items-center gap-2">
          <PrimaryButton
            onClick={openAddModal}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Product
          </PrimaryButton>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex max-w-[200px] items-center rounded-[24px] border border-[#1a2446] bg-[#0e1629] pl-12 pr-4 text-sm shadow-sm transition-colors focus-within:border-[#18aead] focus-within:ring-1 focus-within:ring-[#18aead] lg:max-w-xl">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-blue-300/60" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-transparent py-2.5 text-blue-200 placeholder-blue-300/60 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 lg:flex-1 lg:justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-[20px] border border-[#1a2446] bg-[#0e1629] px-3.5 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] focus:border-[#18aead] focus:outline-none"
          >
            {categories.map(category => (
              <option key={category} value={category} className="bg-[#0e1629]">
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      <PrimaryModal
        open={isModalOpen}
        title={isEditing ? "Edit Product" : "Add Product"}
        description={isEditing ? "Update product details." : "Create a new product in your listing."}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setNewProduct({ 
            sku: "",
            name: "", 
            category: "General", 
            price: 0,
            stock: 0
          });
        }}
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleAddProduct} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-blue-200">
                SKU
              </label>
              <PrimaryInput
                id="sku"
                type="text"
                required
                value={newProduct.sku}
                disabled={isEditing}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-blue-200">
                Product Name
              </label>
              <PrimaryInput
                id="name"
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-blue-200">
                Category
              </label>
              <select
                id="category"
                className="mt-2 w-full rounded-[18px] border border-[#1a2446] bg-[#0e1629] px-4 py-2.5 text-sm text-blue-100 focus:border-[#18aead] focus:outline-none focus:ring-1 focus:ring-[#18aead]"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              >
                {categories.filter(c => c !== "All").map(category => (
                  <option key={category} value={category} className="bg-[#0e1629]">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-blue-200">
                Price ($)
              </label>
              <PrimaryInput
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-blue-200">
                Stock
              </label>
              <PrimaryInput
                id="stock"
                type="number"
                min="0"
                required
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setNewProduct({ 
                  sku: "",
                  name: "", 
                  category: "General", 
                  price: 0,
                  stock: 0
                });
              }}
              className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
            >
              Cancel
            </button>
            <PrimaryButton type="submit">
              Save Product
            </PrimaryButton>
          </div>
        </form>
      </PrimaryModal>

      <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
        <table className="min-w-full divide-y divide-[#1a2446]">
          <thead className="bg-[#0e1629]">
            <tr>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">SKU</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Product</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Category</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Price</span>
              </th>
              <th scope="col" className="px-6 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">Stock</span>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2446] bg-[#0c142a]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.sku} className="transition-colors hover:bg-[#121c3d]">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-white">{product.sku}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-white">{product.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">
                      {product.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-blue-200">${product.price.toFixed(2)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-blue-200">{product.stock}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1 rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-3 py-1.5 text-xs font-semibold text-blue-100 transition-colors hover:bg-[#121c3d] hover:text-white"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-blue-300">
                  {searchTerm ? `No products found for "${searchTerm}".` : products.length === 0 ? 'No products yet. Add one to get started.' : 'Try adjusting your search or filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
