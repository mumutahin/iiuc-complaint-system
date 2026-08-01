import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { validateImageFile } from '../../../shared/validators.js';
import { LIMITS } from '../../../shared/constants.js';

/**
 * `files` is an array of { file: File, previewUrl: string } (existing
 * remote images being edited are represented as { url } instead — see
 * NewComplaintPage for how the two are merged).
 */
export default function ImageUploader({ files, onChange, error }) {
  const inputRef = useRef(null);

  function handleSelect(e) {
    const selected = Array.from(e.target.files || []);
    const room = LIMITS.MAX_IMAGES - files.length;
    const toAdd = selected.slice(0, room);

    const validated = [];
    for (const file of toAdd) {
      const { valid, error: fileError } = validateImageFile(file);
      if (!valid) {
        onChange(files, fileError);
        return;
      }
      validated.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    onChange([...files, ...validated], null);
    e.target.value = '';
  }

  function removeAt(index) {
    const next = files.filter((_, i) => i !== index);
    onChange(next, null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {files.map((f, i) => (
          <div key={f.url || f.previewUrl} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <img src={f.previewUrl || f.url} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {files.length < LIMITS.MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-black/20 text-ink/40 hover:border-brand-400 hover:text-brand-500 dark:border-white/20 dark:text-white/30"
          >
            <ImagePlus size={18} />
            <span className="text-[10px] font-medium">Add photo</span>
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink/40 dark:text-white/30">
        Up to {LIMITS.MAX_IMAGES} images, JPEG/PNG/WEBP, 5MB each.
      </p>
      {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}
