import React, { useEffect } from 'react';

type Variant = {
  id: string;
  price: string;
  currency: string;
  color?: string | null;
  size?: string | null;
  image?: string | null;
};

type Product = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  variants: Variant[];
};

type UploadResult = {
  success?: boolean;
  fileName?: string;
  storedFileName?: string;
  url?: string;
};

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
} | null;

// If VITE_API_BASE_URL is set (for production), use it; otherwise use same-origin
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const apiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

console.log('API_BASE_URL =', API_BASE_URL);
console.log('Products URL =', apiUrl('/api/products'));

export const PrintBuilder: React.FC = () => {
  useEffect(() => {
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);
    const DEFAULT_ARTWORK_TRANSFORM = {
      xPercent: 50,
      yPercent: 45,
      scale: 0.6,
      invert: false,
    };
    const DARK_COLOR_KEYWORDS = ['black', 'charcoal', 'navy', 'midnight', 'graphite', 'forest', 'dark'];
    const LIGHT_COLOR_KEYWORDS = ['white', 'natural', 'cream', 'ivory', 'light', 'ash', 'sand'];

    const state: {
      products: Product[];
      artworkFile: File | null;
      artworkPreviewUrl: string | null;
      artworkUpload: UploadResult | null;
      selectedProduct: Product | null;
      selectedColor: string | null;
      selectedSize: string | null;
      quantity: number;
      lastVariant: Variant | null;
      pageInfo: PageInfo;
      isLoadingProducts: boolean;
      artworkTransform: typeof DEFAULT_ARTWORK_TRANSFORM;
      artworkBlendMode: 'light' | 'dark';
      artworkBlendManual: boolean;
    } = {
      products: [],
      artworkFile: null,
      artworkPreviewUrl: null,
      artworkUpload: null,
      selectedProduct: null,
      selectedColor: null,
      selectedSize: null,
      quantity: 1,
      lastVariant: null,
      pageInfo: null,
      isLoadingProducts: false,
      artworkTransform: { ...DEFAULT_ARTWORK_TRANSFORM },
      artworkBlendMode: 'light',
      artworkBlendManual: false,
    };

    const el = {
      artInput: document.getElementById('art-upload-input') as HTMLInputElement | null,
      artPreview: document.getElementById('art-preview') as HTMLImageElement | null,
      artPreviewPlaceholder: document.getElementById('art-preview-placeholder'),
      artStatus: document.getElementById('art-upload-status'),
      step2: document.getElementById('step-2'),
      step2Badge: document.getElementById('step-2-badge'),
      step2Circle: document.getElementById('step-2-circle'),
      products: document.getElementById('products'),
      productsStatus: document.getElementById('products-status'),
      productsLoadMore: document.getElementById('products-load-more') as HTMLButtonElement | null,
      configEmpty: document.getElementById('config-empty'),
      configContent: document.getElementById('config-content'),
      configProductImage: document.getElementById('config-product-image') as HTMLImageElement | null,
      configArtOverlay: document.getElementById('config-art-overlay') as HTMLImageElement | null,
      configProductTitle: document.getElementById('config-product-title'),
      configProductDescription: document.getElementById('config-product-description'),
      configColors: document.getElementById('config-colors'),
      configSize: document.getElementById('config-size') as HTMLSelectElement | null,
      configQty: document.getElementById('config-qty') as HTMLInputElement | null,
      configPrice: document.getElementById('config-price'),
      configAddBtn: document.getElementById('config-add-btn') as HTMLButtonElement | null,
      configPreview: document.getElementById('config-preview'),
      configArtControls: document.getElementById('config-art-controls'),
      configArtSize: document.getElementById('config-art-size') as HTMLInputElement | null,
      configArtSizeValue: document.getElementById('config-art-size-value'),
      configArtInvert: document.getElementById('config-art-invert') as HTMLButtonElement | null,
      configArtReset: document.getElementById('config-art-reset') as HTMLButtonElement | null,
      configArtBlendLight: document.getElementById('config-art-blend-light') as HTMLButtonElement | null,
      configArtBlendDark: document.getElementById('config-art-blend-dark') as HTMLButtonElement | null,
      configArtBlendAuto: document.getElementById('config-art-blend-auto') as HTMLButtonElement | null,
      configArtBlendStatus: document.getElementById('config-art-blend-status'),
      debugVariantId: document.getElementById('debug-variant-id'),
      debugSelection: document.getElementById('debug-selection'),
    };

    if (
      !el.artInput ||
      !el.artPreview ||
      !el.artPreviewPlaceholder ||
      !el.artStatus ||
      !el.step2 ||
      !el.step2Badge ||
      !el.step2Circle ||
      !el.products ||
      !el.productsStatus ||
      !el.configEmpty ||
      !el.configContent ||
      !el.configProductImage ||
      !el.configArtOverlay ||
      !el.configProductTitle ||
      !el.configProductDescription ||
      !el.configColors ||
      !el.configSize ||
      !el.configQty ||
      !el.configPrice ||
      !el.configAddBtn ||
      !el.configPreview ||
      !el.configArtControls ||
      !el.configArtSize ||
      !el.configArtSizeValue ||
      !el.configArtInvert ||
      !el.configArtReset ||
      !el.configArtBlendLight ||
      !el.configArtBlendDark ||
      !el.configArtBlendAuto ||
      !el.configArtBlendStatus ||
      !el.debugVariantId ||
      !el.debugSelection
    ) {
      // If any required element is missing, do not bind logic.
      console.warn('PrintBuilder: missing DOM elements, skipping binding.');
      return;
    }

    const applyArtworkTransform = () => {
      if (!el.configArtOverlay) return;
      const { xPercent, yPercent, scale, invert } = state.artworkTransform;
      el.configArtOverlay.style.top = `${yPercent}%`;
      el.configArtOverlay.style.left = `${xPercent}%`;
      el.configArtOverlay.style.transform = `translate(-50%, -50%) scale(${scale})`;

      const filters: string[] = [];
      if (invert) filters.push('invert(1)');
      if (state.artworkBlendMode === 'dark') {
        filters.push('brightness(1.25)', 'saturate(1.05)');
        el.configArtOverlay.style.opacity = '1';
      } else {
        filters.push('contrast(1.08)', 'saturate(1.05)');
        el.configArtOverlay.style.opacity = '0.95';
      }
      el.configArtOverlay.style.filter = filters.join(' ');
      el.configArtOverlay.style.mixBlendMode = 'normal';
    };

    const updateArtworkControls = () => {
      if (el.configArtSize && el.configArtSizeValue && el.configArtInvert) {
        el.configArtSize.value = state.artworkTransform.scale.toFixed(2);
        el.configArtSizeValue.textContent = `${Math.round(state.artworkTransform.scale * 100)}%`;
        el.configArtInvert.textContent = state.artworkTransform.invert ? 'Invert off' : 'Invert colors';
      }

      if (
        el.configArtBlendLight &&
        el.configArtBlendDark &&
        el.configArtBlendStatus &&
        el.configArtBlendAuto
      ) {
        const activateBtn = (button: HTMLButtonElement, active: boolean) => {
          button.classList.toggle('bg-black', active);
          button.classList.toggle('text-white', active);
          button.classList.toggle('border-black', active);
          button.classList.toggle('bg-white', !active);
          button.classList.toggle('text-slate-700', !active);
          button.classList.toggle('border-slate-300', !active);
        };

        activateBtn(el.configArtBlendLight, state.artworkBlendMode === 'light');
        activateBtn(el.configArtBlendDark, state.artworkBlendMode === 'dark');

        el.configArtBlendStatus.textContent = state.artworkBlendManual
          ? 'Manual blend'
          : state.selectedColor
          ? `Auto from ${state.selectedColor}`
          : 'Auto blend';

        el.configArtBlendAuto.disabled = !state.artworkBlendManual;
        el.configArtBlendAuto.classList.toggle('opacity-50', !state.artworkBlendManual);
      }
    };

    const enableArtworkControls = (enabled: boolean) => {
      [
        el.configArtSize,
        el.configArtInvert,
        el.configArtReset,
        el.configArtBlendLight,
        el.configArtBlendDark,
        el.configArtBlendAuto,
      ].forEach((control) => {
        if (control) control.disabled = !enabled;
      });
      if (el.configArtControls) {
        el.configArtControls.classList.toggle('opacity-50', !enabled);
        el.configArtControls.classList.toggle('pointer-events-none', !enabled);
      }
    };

    enableArtworkControls(false);
    updateArtworkControls();

    const guessBlendModeFromColor = (color: string | null) => {
      if (!color) return 'light';
      const normalized = color.toLowerCase();
      if (DARK_COLOR_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'dark';
      if (LIGHT_COLOR_KEYWORDS.some((keyword) => normalized.includes(keyword))) return 'light';
      return 'light';
    };

    const syncBlendModeWithColor = () => {
      if (state.artworkBlendManual) {
        updateArtworkControls();
        return;
      }
      const computed = guessBlendModeFromColor(state.selectedColor);
      if (state.artworkBlendMode !== computed) {
        state.artworkBlendMode = computed;
        applyArtworkTransform();
      }
      updateArtworkControls();
    };

    const setProductImageForVariant = (variant: Variant | null) => {
      if (!el.configProductImage || !state.selectedProduct) return;

      const variantImage = variant?.image;
      if (variantImage) {
        el.configProductImage.src = variantImage;
      } else {
        // fallback to product-level image if variant doesn't have one
        el.configProductImage.src = state.selectedProduct.image || '';
      }
    };

    const handleArtworkChange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      state.artworkFile = file;

      if (state.artworkPreviewUrl) {
        URL.revokeObjectURL(state.artworkPreviewUrl);
      }
      state.artworkPreviewUrl = URL.createObjectURL(file);
      state.artworkTransform = { ...DEFAULT_ARTWORK_TRANSFORM };
      state.artworkBlendManual = false;
      syncBlendModeWithColor();

      el.artPreview.src = state.artworkPreviewUrl;
      el.artPreview.classList.remove('hidden');
      el.artPreviewPlaceholder.classList.add('hidden');
      el.artStatus.textContent = `Artwork loaded: ${file.name} (uploading...)`;

      el.step2.classList.remove('opacity-40', 'pointer-events-none');
      el.step2Badge.textContent = 'Artwork ready - Configure your garments';
      el.step2Badge.classList.remove('bg-slate-200', 'text-slate-600');
      el.step2Badge.classList.add('bg-emerald-100', 'text-emerald-700');
      el.step2Circle.classList.remove('bg-slate-900/5', 'text-slate-500');
      el.step2Circle.classList.add('bg-emerald-600', 'text-white');

      if (state.selectedProduct) {
        el.configArtOverlay.src = state.artworkPreviewUrl;
        el.configArtOverlay.classList.remove('hidden');
        applyArtworkTransform();
        enableArtworkControls(true);
        updateArtworkControls();
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(apiUrl('/api/upload'), {
          method: 'POST',
          body: formData,
        });

        const data: UploadResult = await res.json();

        if (!res.ok || !data.success) {
          console.error('Upload failed:', data);
          el.artStatus.textContent =
            "Artwork loaded locally, but upload failed. You can still preview, but the backend doesn't have the file.";
          state.artworkUpload = null;
          return;
        }

        state.artworkUpload = data;
        el.artStatus.textContent = `Artwork uploaded: ${data.fileName} -> ${data.storedFileName}`;
      } catch (err) {
        console.error(err);
        el.artStatus.textContent = 'Artwork loaded locally, but upload failed (network error).';
        state.artworkUpload = null;
      }
    };

    const updateVariantAndPrice = () => {
      if (!state.selectedProduct) return;

      if (el.configSize.value) state.selectedSize = el.configSize.value;
      state.quantity = Number(el.configQty.value || 1) || 1;

      const variant = state.selectedProduct.variants.find((v) => {
        const colorOk = !state.selectedColor || v.color === state.selectedColor;
        const sizeOk = !state.selectedSize || v.size === state.selectedSize;
        return colorOk && sizeOk;
      });

      state.lastVariant = variant || null;

      if (!variant) {
        el.configPrice.textContent = 'Variant not available for this combination.';
        el.configAddBtn.disabled = true;
        el.debugVariantId.textContent = 'None';
        el.debugSelection.textContent = `${state.selectedColor || '...'} / ${
          state.selectedSize || '...'
        } - Qty ${state.quantity}`;
        return;
      }

      const unitPrice = parseFloat(variant.price || '0');
      const total = unitPrice * state.quantity;

      el.configPrice.textContent = `${total.toFixed(2)} ${variant.currency} (est.)`;
      el.configAddBtn.disabled = false;
      el.debugVariantId.textContent = variant.id;
      el.debugSelection.textContent = `${state.selectedColor || '...'} / ${
        state.selectedSize || '...'
      } - Qty ${state.quantity}`;

      // 🔁 also update preview image based on selected variant
      setProductImageForVariant(variant);
    };

    const selectProduct = (productId: string) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) return;

      const sameProduct = state.selectedProduct && state.selectedProduct.id === product.id;

      state.selectedProduct = product;

      const colors = Array.from(
        new Set(product.variants.map((v) => v.color).filter(Boolean)),
      ) as string[];
      const sizes = Array.from(
        new Set(product.variants.map((v) => v.size).filter(Boolean)),
      ) as string[];

      if (!sameProduct || !state.selectedColor || !colors.includes(state.selectedColor)) {
        state.selectedColor = colors[0] || null;
      }
      if (!sameProduct || !state.selectedSize || !sizes.includes(state.selectedSize)) {
        state.selectedSize = sizes[0] || null;
      }

      state.quantity = Number(el.configQty.value || 1) || 1;

      syncBlendModeWithColor();

      el.configEmpty.classList.add('hidden');
      el.configContent.classList.remove('hidden');

      // Default product image (will be refined by variant in updateVariantAndPrice)
      el.configProductImage.src = product.image || '';
      el.configProductTitle.textContent = product.title;
      el.configProductDescription.textContent = product.description || '';

      if (state.artworkPreviewUrl) {
        el.configArtOverlay.src = state.artworkPreviewUrl;
        el.configArtOverlay.classList.remove('hidden');
        applyArtworkTransform();
        enableArtworkControls(true);
        updateArtworkControls();
      } else {
        el.configArtOverlay.classList.add('hidden');
        enableArtworkControls(false);
      }

      el.configColors.innerHTML = '';
      if (colors.length === 0) {
        const span = document.createElement('span');
        span.className = 'text-[11px] text-slate-400';
        span.textContent = 'No color options';
        el.configColors.appendChild(span);
      } else {
        colors.forEach((color) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = color;

          const isActive = color === state.selectedColor;

          btn.className =
            'rounded-full border px-3 py-1 text-[11px] ' +
            (isActive
              ? 'bg-black text-white border-black'
              : 'bg-white text-slate-800 border-slate-300');

          btn.addEventListener('click', () => {
            state.selectedColor = color;
            selectProduct(productId);
            updateVariantAndPrice();
          });

          el.configColors.appendChild(btn);
        });
      }

      el.configSize.innerHTML = '';
      if (sizes.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'No sizes';
        el.configSize.appendChild(opt);
        el.configSize.disabled = true;
      } else {
        el.configSize.disabled = false;
        sizes.forEach((size) => {
          const opt = document.createElement('option');
          opt.value = size;
          opt.textContent = size;
          if (size === state.selectedSize) {
            opt.selected = true;
          }
          el.configSize.appendChild(opt);
        });
      }

      updateVariantAndPrice();
    };

    const renderProductsIntoList = (newProducts: Product[], append: boolean) => {
      if (!append) {
        el.products.innerHTML = '';
      }

      newProducts.forEach((p) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className =
          'text-left rounded-lg border border-slate-200 bg-white p-2 shadow-sm flex items-center gap-2 hover:border-black/70 hover:shadow-md transition';
        card.dataset.productId = p.id;

        const firstVariant = p.variants[0];

        card.innerHTML = `
          <div class="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            ${
              p.image
                ? `<img src="${p.image}" alt="${p.title}" class="object-contain max-h-full max-w-full" />`
                : `<span class="text-[10px] text-slate-400">No image</span>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-[11px] font-semibold text-slate-900 line-clamp-1">${p.title}</h4>
            <p class="text-[10px] text-slate-500 product-description"></p>
            <button type="button" class="product-description-toggle mt-0.5 hidden text-[10px] text-slate-600 underline">Read more</button>
            <p class="text-[10px] text-slate-600">
              From ${
                firstVariant
                  ? `${firstVariant.price} ${firstVariant.currency}`
                  : '...'
              }
            </p>
          </div>
        `;

        const descEl = card.querySelector('.product-description') as HTMLParagraphElement | null;
        const toggleEl = card.querySelector(
          '.product-description-toggle',
        ) as HTMLButtonElement | null;
        const fullDescription = p.description || '';
        const DESCRIPTION_LIMIT = 80;

        if (descEl && toggleEl) {
          const needsTruncate = fullDescription.length > DESCRIPTION_LIMIT;
          let expanded = false;
          const truncated = needsTruncate
            ? `${fullDescription.slice(0, DESCRIPTION_LIMIT).trim()}…`
            : fullDescription;

          const renderDescription = () => {
            descEl.textContent = expanded ? fullDescription : truncated;
            toggleEl.textContent = expanded ? 'Show less' : 'Read more';
            toggleEl.classList.toggle('hidden', !needsTruncate);
          };

          if (needsTruncate) {
            toggleEl.addEventListener('click', (event) => {
              event.stopPropagation();
              expanded = !expanded;
              renderDescription();
            });
          }

          renderDescription();
        }

        card.addEventListener('click', () => {
          selectProduct(p.id);
        });

        el.products.appendChild(card);
      });
    };

    const updateLoadMoreButton = () => {
      if (!el.productsLoadMore) return;

      const info = state.pageInfo;
      if (info && info.hasNextPage && info.endCursor) {
        el.productsLoadMore.classList.remove('hidden');
        el.productsLoadMore.disabled = false;
        el.productsLoadMore.textContent = 'Load more garments';
      } else {
        el.productsLoadMore.classList.add('hidden');
      }
    };

    const loadProducts = async (cursor?: string | null, append = false) => {
      if (state.isLoadingProducts) return;

      state.isLoadingProducts = true;
      el.productsStatus.textContent = append ? 'Loading more products...' : 'Loading products...';

      if (!append) {
        el.products.innerHTML = '';
      }

      const params = new URLSearchParams();
      params.set('limit', '20');
      if (cursor) {
        params.set('cursor', cursor);
      }

      const url = apiUrl(`/api/products?${params.toString()}`);

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          console.error('Products error:', data);
          // Handle invalid_query and Shopify-specific errors nicely
          if (data && data.error === 'invalid_query') {
            el.productsStatus.textContent = data.message || 'Invalid search query.';
          } else if (data && data.error === 'shopify_query_failed') {
            el.productsStatus.textContent =
              data.message || 'Unable to load products from Shopify.';
          } else {
            el.productsStatus.textContent = 'Failed to load products.';
          }
          if (el.productsLoadMore) {
            el.productsLoadMore.classList.add('hidden');
          }
          return;
        }

        const newProducts = (data.products || []) as Product[];

        if (append) {
          state.products = [...state.products, ...newProducts];
        } else {
          state.products = newProducts;
        }

        renderProductsIntoList(newProducts, append);

        if (!state.products.length) {
          el.productsStatus.textContent = 'No products available.';
        } else {
          el.productsStatus.textContent = '';
        }

        // handle pageInfo
        state.pageInfo = (data.pageInfo as PageInfo) ?? null;
        updateLoadMoreButton();
      } catch (err) {
        console.error(err);
        el.productsStatus.textContent = 'Failed to load products.';
        if (el.productsLoadMore) {
          el.productsLoadMore.classList.add('hidden');
        }
      } finally {
        state.isLoadingProducts = false;
      }
    };

    const handleQtyInput = () => {
      if (Number(el.configQty.value) < 1) {
        el.configQty.value = '1';
      }
      updateVariantAndPrice();
    };

    const handleLoadMoreClick = () => {
      if (!state.pageInfo || !state.pageInfo.hasNextPage || !state.pageInfo.endCursor) return;
      if (el.productsLoadMore) {
        el.productsLoadMore.disabled = true;
        el.productsLoadMore.textContent = 'Loading...';
      }
      loadProducts(state.pageInfo.endCursor, true);
    };

    const handleAddClick = async () => {
      if (!state.selectedProduct || !state.lastVariant) {
        alert('Please select a valid color/size combination.');
        return;
      }

      if (
        !state.artworkUpload ||
        !state.artworkUpload.storedFileName ||
        !state.artworkUpload.url
      ) {
        alert('Please upload your artwork and wait for the upload to complete before creating a cart.');
        return;
      }

      const cartPayload = {
        variantId: state.lastVariant.id,
        quantity: state.quantity,
        custom: {
          productId: state.selectedProduct.id,
          productTitle: state.selectedProduct.title,
          color: state.selectedColor,
          size: state.selectedSize,
          artworkFileName: state.artworkFile ? state.artworkFile.name : null,
          artworkStoredFileName: state.artworkUpload.storedFileName,
          artworkUrl: state.artworkUpload.url,
        },
      };

      el.configAddBtn.disabled = true;
      el.configAddBtn.textContent = 'Creating cart...';

      try {
        const res = await fetch(apiUrl('/api/cart/lines'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartPayload),
        });

        let data: { cartId?: string; checkoutUrl?: string };
        try {
          data = (await res.json()) as { cartId?: string; checkoutUrl?: string };
        } catch (e) {
          console.error('Failed to parse cart JSON:', e);
          alert('Cart created but response was invalid. Please try again.');
          return;
        }

        if (!res.ok || !data.checkoutUrl || !data.cartId) {
          console.error('Cart error:', data);
          alert('Failed to create cart. Check console for details.');
          return;
        }

        // Log design (non-blocking)
        try {
          const designPayload = {
            productId: state.selectedProduct.id,
            variantId: state.lastVariant.id,
            color: state.selectedColor,
            size: state.selectedSize,
            quantity: state.quantity,
            artworkFile: state.artworkUpload.storedFileName,
            artworkUrl: state.artworkUpload.url,
            cartId: data.cartId,
            checkoutUrl: data.checkoutUrl,
            status: 'pending',
          };

          await fetch(apiUrl('/api/designs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(designPayload),
          });
        } catch (e) {
          console.error('Failed to log design:', e);
        }

        // Redirect to Shopify
        window.location.href = data.checkoutUrl;
      } catch (err) {
        console.error(err);
        alert('Something went wrong while creating the cart.');
      } finally {
        el.configAddBtn.disabled = false;
        el.configAddBtn.textContent = 'Add customized item (coming soon)';
      }
    };

    const handleArtSizeChange = () => {
      if (!el.configArtSize) return;
      const value = Number(el.configArtSize.value);
      if (Number.isNaN(value)) return;
      state.artworkTransform.scale = clamp(value, 0.3, 1.5);
      applyArtworkTransform();
      updateArtworkControls();
    };

    const handleArtInvertClick = () => {
      state.artworkTransform.invert = !state.artworkTransform.invert;
      applyArtworkTransform();
      updateArtworkControls();
    };

    const handleArtResetClick = () => {
      state.artworkTransform = { ...DEFAULT_ARTWORK_TRANSFORM };
      applyArtworkTransform();
      updateArtworkControls();
    };

    const handleBlendLightClick = () => {
      state.artworkBlendMode = 'light';
      state.artworkBlendManual = true;
      applyArtworkTransform();
      updateArtworkControls();
    };

    const handleBlendDarkClick = () => {
      state.artworkBlendMode = 'dark';
      state.artworkBlendManual = true;
      applyArtworkTransform();
      updateArtworkControls();
    };

    const handleBlendAutoClick = () => {
      state.artworkBlendManual = false;
      syncBlendModeWithColor();
    };

    const handleArtPointerDown = (event: PointerEvent) => {
      if (!state.artworkPreviewUrl || !el.configPreview) return;
      event.preventDefault();
      const previewRect = el.configPreview.getBoundingClientRect();
      const startPointer = { x: event.clientX, y: event.clientY };
      const startTransform = { ...state.artworkTransform };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const deltaXPercent = ((moveEvent.clientX - startPointer.x) / previewRect.width) * 100;
        const deltaYPercent = ((moveEvent.clientY - startPointer.y) / previewRect.height) * 100;

        state.artworkTransform.xPercent = clamp(startTransform.xPercent + deltaXPercent, 5, 95);
        state.artworkTransform.yPercent = clamp(startTransform.yPercent + deltaYPercent, 5, 95);
        applyArtworkTransform();
        updateArtworkControls();
      };

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    };

    // Bind events
    el.artInput.addEventListener('change', handleArtworkChange as EventListener);
    el.configSize.addEventListener('change', updateVariantAndPrice);
    el.configQty.addEventListener('input', handleQtyInput);
    el.configAddBtn.addEventListener('click', handleAddClick);
    el.configArtOverlay.addEventListener('pointerdown', handleArtPointerDown as EventListener);
    el.configArtSize.addEventListener('input', handleArtSizeChange);
    el.configArtInvert.addEventListener('click', handleArtInvertClick);
    el.configArtReset.addEventListener('click', handleArtResetClick);
    el.configArtBlendLight.addEventListener('click', handleBlendLightClick);
    el.configArtBlendDark.addEventListener('click', handleBlendDarkClick);
    el.configArtBlendAuto.addEventListener('click', handleBlendAutoClick);
    if (el.productsLoadMore) {
      el.productsLoadMore.addEventListener('click', handleLoadMoreClick);
    }

    // Initial load
    loadProducts();

    return () => {
      el.artInput.removeEventListener('change', handleArtworkChange as EventListener);
      el.configSize.removeEventListener('change', updateVariantAndPrice);
      el.configQty.removeEventListener('input', handleQtyInput);
      el.configAddBtn.removeEventListener('click', handleAddClick);
      el.configArtOverlay.removeEventListener('pointerdown', handleArtPointerDown as EventListener);
      el.configArtSize.removeEventListener('input', handleArtSizeChange);
      el.configArtInvert.removeEventListener('click', handleArtInvertClick);
      el.configArtReset.removeEventListener('click', handleArtResetClick);
      el.configArtBlendLight.removeEventListener('click', handleBlendLightClick);
      el.configArtBlendDark.removeEventListener('click', handleBlendDarkClick);
      el.configArtBlendAuto.removeEventListener('click', handleBlendAutoClick);
      if (el.productsLoadMore) {
        el.productsLoadMore.removeEventListener('click', handleLoadMoreClick);
      }
      if (state.artworkPreviewUrl) {
        URL.revokeObjectURL(state.artworkPreviewUrl);
      }
    };
  }, []);

  return (
    <section className="bg-slate-50 text-slate-900">
      <div className="min-h-dvh max-w-7xl mx-auto px-4 py-8 pt-32">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                1
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Upload Artwork
                </p>
                <p className="text-xs text-slate-500">
                  Start with the design you would like to print.
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-px flex-1 bg-slate-200"></div>

            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-xs font-semibold text-slate-500"
                id="step-2-circle"
              >
                2
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Choose Garment and Options
                </p>
                <p className="text-xs text-slate-500">
                  Pick style, color, size, and quantity.
                </p>
              </div>
            </div>
          </div>

          <span
            id="step-2-badge"
            className="self-start inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600"
          >
            Upload artwork to unlock garment selection
          </span>
        </div>

        <div className="flex flex-col gap-8">
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-1">
                Step 1 - Upload your artwork
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Supported formats: PNG, JPG, SVG, PDF. Max 25MB. We will use this artwork in the live garment preview.
              </p>

              <div
                id="upload-area"
                className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 sm:px-10 transition hover:border-slate-400"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div
                    id="art-preview-wrapper"
                    className="w-32 h-32 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-inner"
                  >
                    <span id="art-preview-placeholder" className="text-[11px] text-slate-400">
                      Artwork preview
                    </span>
                    <img
                      id="art-preview"
                      alt="Artwork preview"
                      className="hidden max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-800">Drag and drop your file here</p>
                    <p className="text-xs text-slate-500 mt-1">
                      or click to browse. High-resolution files work best for print quality.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-slate-500 border border-slate-200">
                      Max size 25MB - RGB or CMYK
                    </span>
                  </div>

                  <input
                    id="art-upload-input"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <p id="art-upload-status" className="mt-3 text-xs text-slate-500">
                No artwork uploaded yet.
              </p>
            </div>
          </section>

          <section
            id="step-2"
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm opacity-40 pointer-events-none"
          >
            <div className="flex flex-col gap-5 xl:flex-row">
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                      Step 2 - Choose a garment
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select from the available blanks we offer for printing.
                    </p>
                  </div>
                </div>

                <div
                  id="products"
                  className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1"
                ></div>
                <p id="products-status" className="text-xs text-slate-500"></p>
                {/* Load more button for pagination */}
                <button
                  id="products-load-more"
                  type="button"
                  className="mt-2 hidden text-[11px] font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1 transition hover:border-black/70"
                >
                  Load more garments
                </button>
              </div>

              <div
                id="config-panel"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Configuration</p>
                    <p className="text-[11px] text-slate-500">
                      Fine-tune details for this print job.
                    </p>
                  </div>
                </div>

                <div
                  id="config-empty"
                  className="flex-1 flex items-center justify-center text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/60 px-4 py-6"
                >
                  Select a garment on the left to configure color, size, and quantity.
                </div>

                <div id="config-content" className="hidden flex-1 flex flex-col gap-4">
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <div className="flex-1 flex flex-col gap-2">
                      <p className="text-[11px] font-medium text-slate-600">Live preview</p>
                      <div
                        id="config-preview"
                        className="relative w-full max-w-xs aspect-4/5 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden"
                      >
                        <img
                          id="config-product-image"
                          draggable={false}
                          alt="Product mockup"
                          className="max-h-full max-w-full object-contain"
                        />
                        <img
                          id="config-art-overlay"
                          alt="Artwork overlay"
                          className="absolute max-h-[35%] max-w-[60%] object-contain opacity-90 cursor-move"
                          style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        />
                      </div>

                      <div
                        id="config-art-controls"
                        className="rounded-lg border border-slate-200 bg-white/70 p-3 space-y-3 text-[11px]"
                      >
                        <p className="font-medium text-slate-700">Artwork controls</p>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-600">Size</span>
                            <span id="config-art-size-value" className="text-slate-500">60%</span>
                          </div>
                          <input
                            id="config-art-size"
                            type="range"
                            min="0.3"
                            max="1.4"
                            step="0.05"
                            defaultValue="0.6"
                            className="w-full h-1 cursor-pointer accent-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Fabric shade</span>
                            <span id="config-art-blend-status" className="text-slate-500">
                              Auto blend
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              id="config-art-blend-light"
                              type="button"
                              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-black/70"
                            >
                              Light fabric
                            </button>
                            <button
                              id="config-art-blend-dark"
                              type="button"
                              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-black/70"
                            >
                              Dark fabric
                            </button>
                            <button
                              id="config-art-blend-auto"
                              type="button"
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-black/70"
                            >
                              Auto detect
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            id="config-art-invert"
                            type="button"
                            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-black/70"
                          >
                            Invert colors
                          </button>
                          <button
                            id="config-art-reset"
                            type="button"
                            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] text-slate-700 hover:border-black/70"
                          >
                            Reset position
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Tip: drag the artwork on the preview to move it.
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900" id="config-product-title"></p>
                        <p className="text-[11px] text-slate-500 mt-1" id="config-product-description"></p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium text-slate-600 mb-1">Color</p>
                        <div id="config-colors" className="flex flex-wrap gap-1.5"></div>
                      </div>

                      <div className="grid grid-cols-[1.4fr_1fr] gap-2 items-end">
                        <div>
                          <p className="text-[11px] font-medium text-slate-600 mb-1">Size</p>
                          <select
                            id="config-size"
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          ></select>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-slate-600 mb-1">Quantity</p>
                          <input
                            id="config-qty"
                            type="number"
                            min="1"
                            defaultValue={1}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3 mt-2">
                        <p className="text-[11px] text-slate-600 mb-1">Estimated price</p>
                        <p className="text-sm font-semibold text-slate-900" id="config-price">
                          ...
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Exact total may adjust for print locations, complexity, and bulk pricing rules.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-1 space-y-2">
                    <button
                      id="config-add-btn"
                      className="w-full rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      disabled
                    >
                      Add customized item (coming soon)
                    </button>
                    <p className="text-[11px] text-slate-400">
                      Next phase: this will create a Shopify cart with your selections and redirect to checkout.
                    </p>

                    <details className="mt-1 text-[11px] text-slate-500">
                      <summary className="cursor-pointer select-none text-[11px] text-slate-500">
                        Show debug info (dev only)
                      </summary>
                      <div className="mt-1 rounded border border-dashed border-slate-200 bg-slate-50 p-2 space-y-1">
                        <p>
                          <strong>Variant ID:</strong> <span id="debug-variant-id">None</span>
                        </p>
                        <p>
                          <strong>Color / Size / Qty:</strong> <span id="debug-selection">...</span>
                        </p>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

