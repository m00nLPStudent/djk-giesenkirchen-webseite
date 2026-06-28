"use client";

export default function useImageUpload({
  currentUrl,
  placeholderUrl,
  uploadAction,
  deleteAction,
  onChange,
  getUploadContext = () => ({}),
}) {
  async function uploadImage(file) {
    const { data, error } = await uploadAction(file, {
      ...getUploadContext(),
      image_url: currentUrl,
      photo_url: currentUrl,
    });

    if (error) {
      alert(error.message);
      return;
    }

    onChange(data);
  }

  async function removeImage() {
    const { error } = await deleteAction(currentUrl);

    if (error) {
      alert(error.message);
      return;
    }

    onChange(placeholderUrl);
  }

  return {
    uploadImage,
    removeImage,
  };
}
