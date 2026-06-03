"use client";

import { useState } from "react";
import Image from "next/image";
import DeleteImageButton from "./delete-image-button";

type Props = {
  itemName: string;
  images: {
    id: string;
    path: string;
  }[];
};

export default function ImageGallery({ itemName, images }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <Image
        src={images[0].path}
        alt={itemName}
        width={800}
        height={800}
        loading="eager"
        className="mb-4 max-h-[500px] w-full cursor-zoom-in rounded-lg object-contain"
        unoptimized
        onClick={() => setSelected(0)}
      />
      <div className="mb-4">
        <DeleteImageButton imageId={images[0].id} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.id}>
            <Image
              src={image.path}
              alt={itemName}
              width={200}
              height={200}
              className="h-28 w-full cursor-zoom-in rounded border border-[var(--border-color)] object-cover"
              unoptimized
              onClick={() => setSelected(index)}
            />

            <div className="mt-1">
              <DeleteImageButton imageId={image.id} />
            </div>
          </div>
        ))}
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white"
            onClick={() => setSelected(null)}
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 text-4xl text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected === 0 ? images.length - 1 : selected - 1);
                }}
              >
                ‹
              </button>

              <button
                className="absolute right-4 text-4xl text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected === images.length - 1 ? 0 : selected + 1);
                }}
              >
                ›
              </button>
            </>
          )}

          <Image
            src={images[selected].path}
            alt={itemName}
            width={1600}
            height={1600}
            className="max-h-[90vh] w-auto object-contain"
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
