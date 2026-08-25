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
  .admin-richtext-content { display: flow-root; margin: 0; padding: 24px; background: #0f1116; color: #e5e7eb; font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
  p { margin: 0 0 1em; } h1, h2, h3, h4 { color: #fff; line-height: 1.2; margin: 1.4em 0 .6em; }
  pre { clear: both; max-width: 100%; overflow-x: auto; margin: 1em 0; padding: 1em; border-radius: .5em; background: #08090c; white-space: pre-wrap; }
  h1 { font-size: 2em; } h2 { font-size: 1.65em; } h3 { font-size: 1.35em; } h4 { font-size: 1.15em; }
  ul, ol { padding-left: 1.5rem; } a { color: #fb7185; text-decoration: underline; }
  blockquote { margin: 1.25em 0; border-left: 4px solid #dc2626; padding: .5em 1em; color: #d1d5db; }
  table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #4b5563; padding: .6em; text-align: left; } th { background: #1f2937; }
  img { max-width: 100%; height: auto !important; display: block; clear: both; } hr { border: 0; border-top: 1px solid #4b5563; margin: 1.5em 0; }
  img.news-inline-image--standard { margin: 1.25em 0; }
  img.news-inline-image--left { margin: 1.25em auto 1.25em 0; }
  img.news-inline-image--center { margin: 1.25em auto; }
  img.news-inline-image--right { margin: 1.25em 0 1.25em auto; }
  img.news-inline-image--flow-left { clear: none; float: left; margin: .35em 1.25em 1em 0; }
  img.news-inline-image--flow-right { clear: none; float: right; margin: .35em 0 1em 1.25em; }
  .mce-content-body div.mce-resizehandle { position: absolute; z-index: 1298; width: 10px; height: 10px; box-sizing: border-box; border: 1px solid #4099ff; background: #4099ff; }
  .mce-content-body div.mce-resizehandle:first-of-type, .mce-content-body div.mce-resizehandle:nth-of-type(3) { cursor: nwse-resize; }
  .mce-content-body div.mce-resizehandle:nth-of-type(2), .mce-content-body div.mce-resizehandle:nth-of-type(4) { cursor: nesw-resize; }
`;

export const NEWS_INLINE_IMAGE_CLASSES = [
  { title: "Standard / volle Breite", value: "news-inline-image--standard" },
  { title: "Links", value: "news-inline-image--left" },
  { title: "Zentriert", value: "news-inline-image--center" },
  { title: "Rechts", value: "news-inline-image--right" },
  { title: "Textumfluss: Bild links", value: "news-inline-image--flow-left" },
  { title: "Textumfluss: Bild rechts", value: "news-inline-image--flow-right" },
];

const NEWS_INLINE_IMAGE_ACTIONS = [
  { name: "newsimagestandard", title: "Standard", icon: "remove-formatting", value: "news-inline-image--standard" },
  { name: "newsimageleft", title: "Bild links", icon: "align-left", value: "news-inline-image--left" },
  { name: "newsimagecenter", title: "Bild zentriert", icon: "align-center", value: "news-inline-image--center" },
  { name: "newsimageright", title: "Bild rechts", icon: "align-right", value: "news-inline-image--right" },
  { name: "newsimageflowleft", title: "Text rechts neben Bild", icon: "align-left", value: "news-inline-image--flow-left" },
  { name: "newsimageflowright", title: "Text links neben Bild", icon: "align-right", value: "news-inline-image--flow-right" },
];

export function applyNewsInlineImageClass(editor, className) {
  const selected = editor.selection.getNode();
  const image = selected?.nodeName === "IMG" ? selected : editor.dom.getParent(selected, "img");
  if (!image || !NEWS_INLINE_IMAGE_CLASSES.some(({ value }) => value === className)) return false;
  editor.undoManager.transact(() => {
    editor.dom.setAttrib(image, "class", className);
    if (className === "news-inline-image--flow-left" || className === "news-inline-image--flow-right") {
      prepareNewsInlineImageFlow(editor, image);
    } else {
      releaseNewsInlineImageFromPre(editor, image);
    }
  });
  editor.nodeChanged();
  return true;
}

export function releaseNewsInlineImageFromPre(editor, image) {
  const pre = image.parentElement?.nodeName === "PRE" ? image.parentElement : null;
  if (!pre?.parentNode) return false;
  pre.parentNode.insertBefore(image, pre.nextSibling);
  if (editor.dom.isEmpty(pre)) editor.dom.remove(pre);
  return true;
}

export function prepareNewsInlineImageFlow(editor, image) {
  const parent = image.parentElement;
  let paragraph = parent?.nodeName === "P" ? parent : null;

  if (paragraph?.parentNode) {
    paragraph.parentNode.insertBefore(image, paragraph);
  } else if (parent?.nodeName === "PRE" && parent.parentNode) {
    parent.parentNode.insertBefore(image, parent.nextSibling);
    if (editor.dom.isEmpty(parent)) editor.dom.remove(parent);
    paragraph = null;
  } else {
    paragraph = image.nextElementSibling?.nodeName === "P" ? image.nextElementSibling : null;
  }

  if (!paragraph) {
    paragraph = editor.dom.create("p", {}, '<br data-mce-bogus="1">');
    editor.dom.insertAfter(paragraph, image);
  } else if (!paragraph.hasChildNodes()) {
    editor.dom.setHTML(paragraph, '<br data-mce-bogus="1">');
  }

  editor.selection.setCursorLocation(paragraph, 0);
  editor.focus();
}

export function createTinyMceInit({ id, minHeight, placeholder, toolbarMode, required, ariaDescribedBy, onOpenMediaPicker }) {
  const toolbar = ADMIN_TINYMCE_TOOLBARS[toolbarMode] || ADMIN_TINYMCE_TOOLBARS.full;
  return {
    plugins: ADMIN_TINYMCE_PLUGINS,
    toolbar: onOpenMediaPicker ? `${toolbar} | newsmedia` : toolbar,
    menubar: onOpenMediaPicker ? "edit view format tools table help" : "edit view insert format tools table help",
    extended_valid_elements: onOpenMediaPicker ? "img[src|alt|title|class|width|height|style|data-media-asset-id]" : undefined,
    object_resizing: onOpenMediaPicker ? "img" : true,
    resize_img_proportional: true,
    image_dimensions: Boolean(onOpenMediaPicker),
    image_class_list: onOpenMediaPicker ? NEWS_INLINE_IMAGE_CLASSES : undefined,
    image_toolbar: onOpenMediaPicker ? `${NEWS_INLINE_IMAGE_ACTIONS.map(({ name }) => name).join(" ")} | imageoptions` : undefined,
    forced_root_block: "p",
    block_formats: "Absatz=p;Überschrift 1=h1;Überschrift 2=h2;Überschrift 3=h3;Überschrift 4=h4;Vorformatiert=pre",
    paste_data_images: false,
    automatic_uploads: false,
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
      if (onOpenMediaPicker) editor.ui.registry.addButton("newsmedia", { text: "Bild einfügen", icon: "image", tooltip: "Bild aus der Medienbibliothek einfügen", onAction: onOpenMediaPicker });
      if (onOpenMediaPicker) {
        for (const action of NEWS_INLINE_IMAGE_ACTIONS) {
          editor.ui.registry.addToggleButton(action.name, {
            icon: action.icon,
            tooltip: action.title,
            onAction: () => applyNewsInlineImageClass(editor, action.value),
            onSetup: (api) => {
              const update = () => api.setActive(editor.dom.hasClass(editor.selection.getNode(), action.value));
              editor.on("NodeChange", update);
              return () => editor.off("NodeChange", update);
            },
          });
        }
        const rejectLocalImage = (event) => {
          const files = [...(event.clipboardData?.files || event.dataTransfer?.files || [])];
          if (!files.some((file) => file.type?.startsWith("image/"))) return;
          event.preventDefault();
          editor.notificationManager.open({ text: "Bilder bitte über ‚Bild einfügen‘ hochladen.", type: "warning" });
        };
        editor.on("paste drop", rejectLocalImage);
        editor.on("ObjectResized", (event) => {
          if (event.target?.nodeName === "IMG") {
            editor.dom.removeClass(event.target, "news-inline-image--standard");
          }
        });
      }
      editor.on("init", () => {
        const body = editor.getBody();
        body?.setAttribute("aria-labelledby", id);
        if (ariaDescribedBy) body?.setAttribute("aria-describedby", ariaDescribedBy);
        if (required) body?.setAttribute("aria-required", "true");
      });
    },
  };
}
