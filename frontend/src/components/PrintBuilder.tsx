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

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

type UploadResult = {
  success?: boolean;
  fileName?: string;
  storedFileName?: string;
  url?: string;
};

type ProductsResponse = {
  products?: Product[];
  pageInfo?: PageInfo | null;
  error?: string;
  message?: string;
  details?: string;
};

// If VITE_API_BASE_URL is set (for production), use it; otherwise use same-origin
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const apiUrl = (endpoint: string) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

const PRODUCTS_PAGE_SIZE = 20;

export const PrintBuilder: React.FC = () => {
  useEffect(() => {
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
      artScale: number; // 1.0 = 100%
      productsPageInfo: PageInfo | null;
      productsQuery: string | null;
      activeProductImage: string | null; // drives mockup background for selected variant
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
      artScale: 1,
      productsPageInfo: null,
      productsQuery: null,
      activeProductImage: null,
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
      debugVariantId: document.getElementById('debug-variant-id'),
      debugSelection: document.getElementById('debug-selection'),
      mockupCanvas: document.getElementById('mockup-canvas') as HTMLCanvasElement | null,
      artScale: document.getElementById('art-scale') as HTMLInputElement | null,
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
      !el.productsLoadMore ||
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
      !el.debugVariantId ||
      !el.debugSelection ||
      !el.mockupCanvas ||
      !el.artScale
    ) {
      // If any required element is missing, do not bind logic.
      return;
    }

    // ------------------------------
    // CANVAS BLENDING HELPERS
    // ------------------------------

    const computeTorsoZone = (
      width: number,
      height: number
    ): { topPct: number; heightPct: number; leftPct: number; widthPct: number } => {
      // Simple, robust torso zone good for tees/hoodies/sweaters
      // You can tweak these later after seeing a few products.
      const leftPct = 0.22;
      const widthPct = 0.56;

      // Slightly dynamic height based on aspect ratio
      const aspect = height / width;
      let topPct = 0.34;
      let heightPct = 0.36;

      if (aspect > 1.3) {
        // Longer garments (hoodies, tall shots)
        topPct = 0.36;
        heightPct = 0.38;
      }

      return { topPct, heightPct, leftPct, widthPct };
    };

    const sampleBrightnessInZone = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      zone: { topPct: number; heightPct: number; leftPct: number; widthPct: number }
    ): number => {
      const x0 = Math.floor(width * zone.leftPct);
      const y0 = Math.floor(height * zone.topPct);
      const w = Math.floor(width * zone.widthPct);
      const h = Math.floor(height * zone.heightPct);

      const imgData = ctx.getImageData(x0, y0, w, h);
      const data = imgData.data;
      let sum = 0;
      let count = 0;

      const step = 4 * 10; // sample every ~10 pixels horizontally

      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        sum += brightness;
        count++;
      }

      return count ? sum / count : 160;
    };

    const renderMockup = () => {
      if (
        !state.selectedProduct ||
        !state.activeProductImage ||
        !state.artworkPreviewUrl ||
        !el.mockupCanvas
      ) {
        return;
      }

      const canvas = el.mockupCanvas;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const garmentImg = new Image();
      garmentImg.crossOrigin = 'anonymous';
      garmentImg.src = state.activeProductImage;

      const artImg = new Image();
      artImg.crossOrigin = 'anonymous';
      artImg.src = state.artworkPreviewUrl;

      let garmentLoaded = false;
      let artLoaded = false;

      const tryRender = () => {
        if (!garmentLoaded || !artLoaded) return;

        const gw = garmentImg.naturalWidth || garmentImg.width;
        const gh = garmentImg.naturalHeight || garmentImg.height;

        if (!gw || !gh) return;

        // Match canvas to garment intrinsic size for best quality
        canvas.width = gw;
        canvas.height = gh;

        // Draw garment background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(garmentImg, 0, 0, canvas.width, canvas.height);

        // Compute torso print zone
        const zone = computeTorsoZone(canvas.width, canvas.height);

        // Determine base art size (auto-scale)
        const zoneW = canvas.width * zone.widthPct;
        const zoneH = canvas.height * zone.heightPct;

        const artAspect = artImg.naturalHeight / artImg.naturalWidth || 1;
        const baseArtWidth = zoneW * 0.8; // base 80% of zone width
        let artWidth = baseArtWidth * state.artScale; // apply user scale
        let artHeight = artWidth * artAspect;

        // Clamp to zone height if it overflows
        if (artHeight > zoneH * 0.9) {
          const scaleDown = (zoneH * 0.9) / artHeight;
          artHeight *= scaleDown;
          artWidth *= scaleDown;
        }

        // Center artwork in the zone
        const artX = canvas.width * zone.leftPct + (zoneW - artWidth) / 2;
        const artY = canvas.height * zone.topPct + (zoneH - artHeight) / 2;

        // Measure brightness inside torso region for blend mode
        const avgBrightness = sampleBrightnessInZone(ctx, canvas.width, canvas.height, zone);

        // Draw artwork with different blending based on garment tone
        if (avgBrightness >= 190) {
          // Very light shirts (white/cream)
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.95;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);

          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = 0.35;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);
        } else if (avgBrightness >= 120) {
          // Mid-tone shirts
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.85;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);

          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = 0.4;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);
        } else {
          // Dark shirts
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.9;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);

          ctx.globalCompositeOperation = 'soft-light';
          ctx.globalAlpha = 0.35;
          ctx.drawImage(artImg, artX, artY, artWidth, artHeight);
        }

        // Re-apply garment texture (wrinkles/shadows) on top to blend
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.45;
        ctx.drawImage(garmentImg, 0, 0, canvas.width, canvas.height);

        // Reset state
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      };

      garmentImg.onload = () => {
        garmentLoaded = true;
        tryRender();
      };
      artImg.onload = () => {
        artLoaded = true;
        tryRender();
      };
    };

    // ------------------------------
    // EVENTS / LOGIC
    // ------------------------------

    const handleArtworkChange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      state.artworkFile = file;

      if (state.artworkPreviewUrl) {
        URL.revokeObjectURL(state.artworkPreviewUrl);
      }
      state.artworkPreviewUrl = URL.createObjectURL(file);

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
        // trigger canvas re-render
        setTimeout(renderMockup, 50);
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
        state.activeProductImage = state.selectedProduct?.image || null;
        el.configProductImage.src = state.activeProductImage || '';
        if (state.artworkPreviewUrl) {
          setTimeout(renderMockup, 50);
        }
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

      // prefer variant-specific image if provided, fall back to product feature image
      const variantImage = variant.image || state.selectedProduct.image || null;
      state.activeProductImage = variantImage;
      el.configProductImage.src = variantImage || '';
      if (state.artworkPreviewUrl) {
        setTimeout(renderMockup, 50);
      }
    };

    const selectProduct = (productId: string) => {
      const product = state.products.find((p) => p.id === productId);
      if (!product) return;

      const sameProduct = state.selectedProduct && state.selectedProduct.id === product.id;

      state.selectedProduct = product;
      // default mockup image to the product-level photo until a variant overrides it
      state.activeProductImage = product.image || null;

      const colors = Array.from(
        new Set(product.variants.map((v) => v.color).filter(Boolean))
      ) as string[];
      const sizes = Array.from(
        new Set(product.variants.map((v) => v.size).filter(Boolean))
      ) as string[];

      if (!sameProduct || !state.selectedColor || !colors.includes(state.selectedColor)) {
        state.selectedColor = colors[0] || null;
      }
      if (!sameProduct || !state.selectedSize || !sizes.includes(state.selectedSize)) {
        state.selectedSize = sizes[0] || null;
      }

      state.quantity = Number(el.configQty.value || 1) || 1;

      el.configEmpty.classList.add('hidden');
      el.configContent.classList.remove('hidden');

      el.configProductImage.src = state.activeProductImage || '';
      el.configProductTitle.textContent = product.title;
      el.configProductDescription.textContent = product.description || '';

      if (state.artworkPreviewUrl) {
        // re-render canvas with new garment + artwork
        setTimeout(renderMockup, 50);
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
            (isActive ? 'bg-black text-white border-black' : 'bg-white text-slate-800 border-slate-300');

          btn.addEventListener('click', () => {
            state.selectedColor = color;
            selectProduct(productId);
            updateVariantAndPrice();
            renderMockup();
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

    const renderProductsList = () => {
      el.products.innerHTML = '';

      if (state.products.length === 0) {
        el.productsStatus.textContent = 'No products available.';
        return;
      }

      el.productsStatus.textContent = '';

      state.products.forEach((p) => {
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
            <p class="text-[10px] text-slate-500 line-clamp-1">${p.description || ''}</p>
            <p class="text-[10px] text-slate-600">
              From ${
                firstVariant
                  ? `${firstVariant.price} ${firstVariant.currency}`
                  : '...'
              }
            </p>
          </div>
        `;

        card.addEventListener('click', () => {
          selectProduct(p.id);
        });

        el.products.appendChild(card);
      });
    };

    const updateLoadMoreVisibility = () => {
      const pageInfo = state.productsPageInfo;
      if (pageInfo && pageInfo.hasNextPage && pageInfo.endCursor) {
        el.productsLoadMore.classList.remove('hidden');
        el.productsLoadMore.disabled = false;
        el.productsLoadMore.textContent = 'Load more garments';
      } else {
        el.productsLoadMore.classList.add('hidden');
      }
    };

    const loadProducts = async ({
      cursor = null,
      append = false,
    }: { cursor?: string | null; append?: boolean } = {}) => {
      if (append) {
        el.productsLoadMore.disabled = true;
        el.productsLoadMore.textContent = 'Loading more...';
      } else {
        el.productsStatus.textContent = 'Loading products...';
      }

      try {
        const params = new URLSearchParams();
        params.set('limit', String(PRODUCTS_PAGE_SIZE));
        if (cursor) {
          params.set('cursor', cursor);
        }
        if (state.productsQuery) {
          params.set('query', state.productsQuery);
        }

        const res = await fetch(apiUrl(`/api/products?${params.toString()}`));
        const data = (await res.json()) as ProductsResponse;

        if (!res.ok || data.error) {
          // backend returns structured errors when Shopify is unavailable.
          const msg =
            data.message ||
            'Shopify returned an error while loading products.';
          throw new Error(`${data.error || 'error'}: ${msg}`);
        }

        const fetched = data.products ?? [];
        state.products = append ? [...state.products, ...fetched] : fetched;
        state.productsPageInfo = data.pageInfo ?? null;

        if (state.products.length === 0) {
          el.products.innerHTML = '';
          el.productsStatus.textContent = 'No products available.';
        } else {
          renderProductsList();
        }

        updateLoadMoreVisibility();
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load products.';
        if (append) {
          el.productsLoadMore.textContent = 'Load more garments';
        }
        el.productsStatus.textContent = message;
        el.productsLoadMore.classList.add('hidden');
      } finally {
        if (append) {
          el.productsLoadMore.disabled = false;
        }
      }
    };

    const handleLoadMoreProducts = () => {
      const pageInfo = state.productsPageInfo;
      if (!pageInfo || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
      loadProducts({ cursor: pageInfo.endCursor, append: true });
    };

    const handleQtyInput = () => {
      if (Number(el.configQty.value) < 1) {
        el.configQty.value = '1';
      }
      updateVariantAndPrice();
    };

    const handleArtScaleInput = () => {
      const raw = Number(el.artScale.value || '100');
      const clamped = Math.min(140, Math.max(60, raw)); // 60–140%
      state.artScale = clamped / 100;
      el.artScale.value = String(clamped);
      renderMockup();
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

    // Bind listeners
    el.artInput.addEventListener('change', handleArtworkChange as EventListener);
    el.configSize.addEventListener('change', updateVariantAndPrice);
    el.configQty.addEventListener('input', handleQtyInput);
    el.configAddBtn.addEventListener('click', handleAddClick);
    el.artScale.addEventListener('input', handleArtScaleInput);
    el.productsLoadMore.addEventListener('click', handleLoadMoreProducts);

    loadProducts();

    return () => {
      el.artInput.removeEventListener('change', handleArtworkChange as EventListener);
      el.configSize.removeEventListener('change', updateVariantAndPrice);
      el.configQty.removeEventListener('input', handleQtyInput);
      el.configAddBtn.removeEventListener('click', handleAddClick);
      el.artScale.removeEventListener('input', handleArtScaleInput);
      el.productsLoadMore.removeEventListener('click', handleLoadMoreProducts);
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
                Supported formats: PNG, JPG, SVG, PDF. Max 25MB. We will use this artwork in the live garment
                preview.
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
                <button
                  id="products-load-more"
                  className="hidden text-[11px] font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1 transition hover:border-black/70"
                  type="button"
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
                      <div className="relative w-full max-w-xs aspect-4/5 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                        <canvas
                          id="mockup-canvas"
                          className="w-full h-full"
                        />
                        {/* Hidden fallback images (not used by canvas, but kept for compatibility) */}
                        <img
                          id="config-product-image"
                          alt="Product mockup"
                          className="hidden max-h-full max-w-full object-contain"
                        />
                        <img
                          id="config-art-overlay"
                          alt="Artwork overlay"
                          className="hidden pointer-events-none absolute object-contain"
                        />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-600">
                            Print size
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Smaller
                            <span className="mx-1">·</span>
                            Larger
                          </span>
                        </div>
                        <input
                          id="art-scale"
                          type="range"
                          min={60}
                          max={140}
                          defaultValue={100}
                          className="w-full accent-slate-900"
                        />
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
                            min={1}
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
                          <strong>Color / Size / Qty:</strong>{' '}
                          <span id="debug-selection">...</span>
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
