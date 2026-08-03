export const ADMIN_TINYMCE_PLUGINS = [
  "advlist", "anchor", "autolink", "autoresize", "charmap", "code",
  "fullscreen", "help", "image", "link", "lists", "searchreplace",
  "table", "visualblocks", "wordcount",
];

export const ADMIN_TINYMCE_TOOLBARS = {
  full: "undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote link table hr charmap | removeformat searchreplace code fullscreen help",
  compact: "undo redo | blocks | bold italic underline | bullist numlist | link | removeformat code fullscreen",
};

export const ADMIN_TINYMCE_CONTENT_STYLE = `
  .admin-richtext-content { margin: 0; padding: 24px; background: #0f1116; color: #e5e7eb; font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
  p { margin: 0 0 1em; } h1, h2, h3, h4 { color: #fff; line-height: 1.2; margin: 1.4em 0 .6em; }
  h1 { font-size: 2em; } h2 { font-size: 1.65em; } h3 { font-size: 1.35em; } h4 { font-size: 1.15em; }
  ul, ol { padding-left: 1.5rem; } a { color: #fb7185; text-decoration: underline; }
  blockquote { margin: 1.25em 0; border-left: 4px solid #dc2626; padding: .5em 1em; color: #d1d5db; }
  table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #4b5563; padding: .6em; text-align: left; } th { background: #1f2937; }
  img { max-width: 100%; height: auto; } hr { border: 0; border-top: 1px solid #4b5563; margin: 1.5em 0; }
`;

export function createTinyMceInit({ id, minHeight, placeholder, toolbarMode, required, ariaDescribedBy }) {
  return {
    plugins: ADMIN_TINYMCE_PLUGINS,
    toolbar: ADMIN_TINYMCE_TOOLBARS[toolbarMode] || ADMIN_TINYMCE_TOOLBARS.full,
    menubar: "edit view insert format tools table help",
    skin: false,
    content_css: false,
    content_style: ADMIN_TINYMCE_CONTENT_STYLE,
    body_class: "admin-richtext-content",
    min_height: Math.max(180, Number(minHeight) || 260),
    max_height: 720,
    autoresize_bottom_margin: 16,
    toolbar_mode: "wrap",
    resize: true,
    branding: false,
    promotion: false,
    placeholder,
    browser_spellcheck: true,
    convert_unsafe_embeds: true,
    iframe_aria_text: required ? "Pflichtfeld: Rich-Text-Inhalt" : "Rich-Text-Inhalt",
    setup: (editor) => {
      editor.on("init", () => {
        const body = editor.getBody();
        body?.setAttribute("aria-labelledby", id);
        if (ariaDescribedBy) body?.setAttribute("aria-describedby", ariaDescribedBy);
        if (required) body?.setAttribute("aria-required", "true");
      });
    },
  };
}
