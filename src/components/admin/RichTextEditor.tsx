import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Unlink,
  Type,
  Palette,
  Highlighter,
  Undo,
  Redo,
  Code,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  Upload,
  Loader2,
  ShieldCheck,
  Truck,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Table as TableIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const TEXT_COLORS = [
  { label: 'افتراضي (أسود)', value: '#1c1917' },
  { label: 'رمادي داكن', value: '#44403c' },
  { label: 'أحمر عريض', value: '#dc2626' },
  { label: 'أخضر زمردي', value: '#059669' },
  { label: 'أزرق ملكي', value: '#2563eb' },
  { label: 'بني دافئ', value: '#78350f' },
  { label: 'ذهبي / كهرماني', value: '#d97706' },
  { label: 'بنفسجي أنيق', value: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { label: 'بدون تظليل', value: 'transparent' },
  { label: 'أصفر فاقع', value: '#fef08a' },
  { label: 'أخضر ناعم', value: '#bbf7d0' },
  { label: 'أزرق فاتح', value: '#bfdbfe' },
  { label: 'وردي لطيف', value: '#fbcfe8' },
  { label: 'برتقالي هادئ', value: '#fed7aa' },
];

const CALLOUT_PRESETS = [
  {
    title: 'صندوق ضمان ذهبي',
    icon: 'shield',
    border: '#10b981',
    bg: '#f0fdf4',
    text: '#065f46',
    html: `
<div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: right; direction: rtl;">
  <div style="font-weight: 800; color: #166534; font-size: 15px; margin-bottom: 6px;">🛡️ ضمان الجودة والاستبدال 100%</div>
  <p style="margin: 0; color: #15803d; font-size: 13px; line-height: 1.6;">نوفر لكم إمكانية فحص ومعاينة المنتج قبل الدفع مع ضمان استبدال مجاني في حال وجود أي ملاحظة خلال 7 أيام.</p>
</div>`,
  },
  {
    title: 'صندوق التوصيل السريع',
    icon: 'truck',
    border: '#0284c7',
    bg: '#f0f9ff',
    text: '#075985',
    html: `
<div style="background-color: #f0f9ff; border: 2px solid #7dd3fc; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: right; direction: rtl;">
  <div style="font-weight: 800; color: #0369a1; font-size: 15px; margin-bottom: 6px;">🚚 شحن وتوصيل سريع ومجاني</div>
  <p style="margin: 0; color: #0284c7; font-size: 13px; line-height: 1.6;">التوصيل حتى باب المنزل في جميع مدن المغرب خلال 24 إلى 48 ساعة فقط والدفع نقداً عند الاستلام.</p>
</div>`,
  },
  {
    title: 'تنبيه نفاذ الكمية',
    icon: 'flame',
    border: '#ef4444',
    bg: '#fef2f2',
    text: '#991b1b',
    html: `
<div style="background-color: #fef2f2; border: 2px dashed #f87171; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: right; direction: rtl;">
  <div style="font-weight: 800; color: #dc2626; font-size: 15px; margin-bottom: 6px;">⚡ كمية محدودة جداً في المخزون!</div>
  <p style="margin: 0; color: #b91c1c; font-size: 13px; line-height: 1.6;">الطلب مرتفع جداً والكميات المتبقية تشارف على النفاذ، اطلب الآن واستفد من العرض قبل انتهاء المخزون.</p>
</div>`,
  },
  {
    title: 'جدول المقاسات والمواصفات',
    icon: 'table',
    border: '#e5e7eb',
    bg: '#ffffff',
    text: '#1f2937',
    html: `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; font-size: 13px; text-align: right; direction: rtl;">
  <thead>
    <tr style="background-color: #f3f4f6; color: #111827; font-weight: bold;">
      <th style="padding: 10px 12px; border: 1px solid #e5e7eb;">المقاس</th>
      <th style="padding: 10px 12px; border: 1px solid #e5e7eb;">محيط الصدر (سم)</th>
      <th style="padding: 10px 12px; border: 1px solid #e5e7eb;">الطول الكلي (سم)</th>
      <th style="padding: 10px 12px; border: 1px solid #e5e7eb;">الوزن المناسب</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">M</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">96 - 100</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">135</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">55 - 65 كغ</td>
    </tr>
    <tr style="background-color: #f9fafb;">
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">L</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">102 - 106</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">138</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">65 - 75 كغ</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">XL</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">108 - 114</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">140</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">75 - 88 كغ</td>
    </tr>
  </tbody>
</table>`,
  },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'اكتب تفاصيل المنتج، مميزاته، خاماته وطريقة الاستخدام...',
  minHeight = '240px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Popups & active dropdown states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Image insertion state
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  // Link insertion state
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');

  // Selected image formatting toolbar
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);

  // Caret / Selection preservation so images insert at cursor position
  const savedRangeRef = useRef<Range | null>(null);
  const [imgRadius, setImgRadius] = useState<'sharp' | 'rounded' | 'pill'>('rounded');
  const [imgSpacing, setImgSpacing] = useState<'seamless' | 'normal' | 'compact'>('seamless');

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  // Sync value from parent to inner contentEditable if modified outside
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setHtmlContent(value || '');
  }, [value, isHtmlMode]);

  // Execute formatting command safely
  const exec = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleEditorChange();
    saveSelection();
  };

  const handleEditorChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setHtmlContent(html);
    onChange(html);
  };

  const handleHtmlCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlContent(val);
    onChange(val);
  };

  // Toggle HTML code mode
  const toggleHtmlMode = () => {
    if (!isHtmlMode) {
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
    } else {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = htmlContent;
        }
      }, 0);
    }
    setIsHtmlMode(!isHtmlMode);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowCalloutMenu(false);
  };

  // Heading change handler
  const handleFormatBlock = (tag: string) => {
    exec('formatBlock', `<${tag}>`);
  };

  // Image insertion at caret position with custom border radius and spacing
  const insertImageTag = (url: string) => {
    if (!url.trim()) return;
    const safeUrl = url.trim();
    const radiusCss = imgRadius === 'sharp' ? '0px' : imgRadius === 'pill' ? '24px' : '12px';
    const isSeamless = imgSpacing === 'seamless';

    // When seamless, 0 margin & line-height: 0 ensures adjacent images stack with 0 gap!
    const containerStyle = isSeamless
      ? 'text-align: center; margin: 0; padding: 0; line-height: 0;'
      : imgSpacing === 'compact'
      ? 'text-align: center; margin: 8px 0; line-height: 1;'
      : 'text-align: center; margin: 16px 0; line-height: 1.4;';

    const imgStyle = `max-width: 100%; border-radius: ${radiusCss}; display: block; margin: 0 auto; vertical-align: top; ${
      isSeamless ? '' : 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);'
    }`;

    const imgHtml = `<div data-img-wrapper="true" style="${containerStyle}"><img src="${safeUrl}" alt="صورة توضيحية للمنتج" style="${imgStyle}" /></div>${
      isSeamless ? '' : '<p><br/></p>'
    }`;

    if (isHtmlMode) {
      const updated = htmlContent + '\n' + imgHtml;
      setHtmlContent(updated);
      onChange(updated);
    } else {
      editorRef.current?.focus();
      let inserted = false;
      const sel = window.getSelection();

      // If we have a saved cursor location inside editor, insert exactly there
      if (savedRangeRef.current && editorRef.current?.contains(savedRangeRef.current.commonAncestorContainer)) {
        try {
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
          }
          const temp = document.createElement('div');
          temp.innerHTML = imgHtml;
          const frag = document.createDocumentFragment();
          let node: Node | null;
          let lastNode: Node | null = null;
          while ((node = temp.firstChild)) {
            lastNode = frag.appendChild(node);
          }
          savedRangeRef.current.deleteContents();
          savedRangeRef.current.insertNode(frag);

          if (lastNode && sel) {
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            savedRangeRef.current = newRange;
          }
          inserted = true;
        } catch (err) {
          console.error('Caret insertion fallback:', err);
        }
      }

      // If no valid range, append to end of editor so it NEVER jumps above existing text to the top
      if (!inserted && editorRef.current) {
        const temp = document.createElement('div');
        temp.innerHTML = imgHtml;
        while (temp.firstChild) {
          editorRef.current.appendChild(temp.firstChild);
        }
      }

      handleEditorChange();
    }

    setShowImageModal(false);
    setImageUrlInput('');
  };

  // Upload local image file
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result as string;
        try {
          const finalUrl = await apiService.uploadImage(base64);
          insertImageTag(finalUrl);
        } catch {
          // Fallback to base64 if server upload failed
          insertImageTag(base64);
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingImage(false);
    }
  };

  // Insert Callout Box
  const handleInsertCallout = (calloutHtml: string) => {
    if (isHtmlMode) {
      const updated = htmlContent + '\n' + calloutHtml + '\n<p><br/></p>';
      setHtmlContent(updated);
      onChange(updated);
    } else {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, calloutHtml + '<p><br/></p>');
      handleEditorChange();
    }
    setShowCalloutMenu(false);
  };

  // Insert Link
  const handleInsertLink = () => {
    if (!linkUrlInput.trim()) return;
    let url = linkUrlInput.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      url = 'https://' + url;
    }

    const text = linkTextInput.trim() || url;
    const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${text}</a>`;

    if (isHtmlMode) {
      const updated = htmlContent + ' ' + linkHtml;
      setHtmlContent(updated);
      onChange(updated);
    } else {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, linkHtml);
      handleEditorChange();
    }

    setShowLinkModal(false);
    setLinkUrlInput('');
    setLinkTextInput('');
  };

  // Handle click on editor elements (e.g. detect if image is clicked)
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'img') {
      setSelectedImgEl(target as HTMLImageElement);
    } else {
      setSelectedImgEl(null);
    }
  };

  // Adjust clicked image
  const setImgWidth = (widthPercent: string) => {
    if (!selectedImgEl) return;
    selectedImgEl.style.width = widthPercent;
    selectedImgEl.style.maxWidth = '100%';
    handleEditorChange();
  };

  const setImgRadiusDirect = (radius: string) => {
    if (!selectedImgEl) return;
    selectedImgEl.style.borderRadius = radius;
    handleEditorChange();
  };

  const setImgSpacingDirect = (type: 'seamless' | 'normal') => {
    if (!selectedImgEl) return;
    const parent = selectedImgEl.parentElement;
    if (type === 'seamless') {
      selectedImgEl.style.display = 'block';
      selectedImgEl.style.margin = '0 auto';
      selectedImgEl.style.verticalAlign = 'top';
      selectedImgEl.style.boxShadow = 'none';
      if (parent) {
        parent.style.margin = '0';
        parent.style.padding = '0';
        parent.style.lineHeight = '0';
      }
    } else {
      selectedImgEl.style.display = 'block';
      selectedImgEl.style.margin = '0 auto';
      selectedImgEl.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.08)';
      if (parent) {
        parent.style.margin = '16px 0';
        parent.style.lineHeight = '1.4';
      }
    }
    handleEditorChange();
  };

  const removeSelectedImg = () => {
    if (!selectedImgEl) return;
    selectedImgEl.remove();
    setSelectedImgEl(null);
    handleEditorChange();
  };

  return (
    <div
      className={`border border-stone-300 rounded-xl bg-white shadow-2xs overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-2 sm:inset-6 z-50 flex flex-col shadow-2xl border-stone-800' : 'relative'
      }`}
    >
      {/* 1. TOP TOOLBAR (Word & YouCan Style) */}
      <div className="bg-stone-100/90 border-b border-stone-200 p-1.5 flex flex-wrap items-center gap-1 text-stone-700 select-none">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pl-1 border-l border-stone-300">
          <button
            type="button"
            onClick={() => exec('undo')}
            className="p-1.5 hover:bg-white rounded-md text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            title="تراجع (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            className="p-1.5 hover:bg-white rounded-md text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            title="إعادة (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Style: Heading Dropdown */}
        <div className="flex items-center gap-0.5 px-1 border-l border-stone-300">
          <select
            onChange={(e) => handleFormatBlock(e.target.value)}
            disabled={isHtmlMode}
            defaultValue="p"
            className="text-xs bg-white border border-stone-300 rounded-md px-2 py-1 text-stone-800 font-bold focus:outline-none cursor-pointer"
            title="نمط الخط والترويسة"
          >
            <option value="p">نص عادي (فقرة)</option>
            <option value="h1">عنوان رئيسي كبير (H1)</option>
            <option value="h2">عنوان فرعي (H2)</option>
            <option value="h3">عنوان قسم (H3)</option>
            <option value="blockquote">اقتباس مظلل</option>
          </select>
        </div>

        {/* Text Styling (B, I, U, S) */}
        <div className="flex items-center gap-0.5 px-1 border-l border-stone-300">
          <button
            type="button"
            onClick={() => exec('bold')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white active:bg-stone-200 rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="خط عريض (Bold)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white active:bg-stone-200 rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="خط مائل (Italic)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white active:bg-stone-200 rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="تسطير أسفل النص (Underline)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white active:bg-stone-200 rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="شطب النص (Strikethrough)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Color & Highlight */}
        <div className="relative flex items-center gap-0.5 px-1 border-l border-stone-300">
          {/* Text Color Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setShowCalloutMenu(false);
              }}
              disabled={isHtmlMode}
              className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="لون الخط"
            >
              <Palette className="w-3.5 h-3.5 text-stone-700" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-stone-200 rounded-xl p-2.5 shadow-lg w-44 grid grid-cols-4 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      exec('foreColor', c.value);
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-lg border border-stone-200 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlight Color Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setShowCalloutMenu(false);
              }}
              disabled={isHtmlMode}
              className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="تظليل النص (خلفية)"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-stone-200 rounded-xl p-2.5 shadow-lg w-44 grid grid-cols-3 gap-1.5">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      exec('hiliteColor', c.value);
                      setShowHighlightPicker(false);
                    }}
                    className="h-7 rounded-md border border-stone-300 text-[10px] font-bold text-stone-800 hover:scale-105 transition-transform cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: c.value === 'transparent' ? '#fff' : c.value }}
                    title={c.label}
                  >
                    {c.value === 'transparent' ? 'إلغاء' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alignment (RTL, Center, Left, Justify) */}
        <div className="flex items-center gap-0.5 px-1 border-l border-stone-300">
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="محاذاة لليمين"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="توسيط"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="محاذاة لليسار"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyFull')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="ضبط النص (Justify)"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists (Bullets & Numbers) */}
        <div className="flex items-center gap-0.5 px-1 border-l border-stone-300">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="قائمة نقطية"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="قائمة رقمية"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insert Image & Link & Divider */}
        <div className="flex items-center gap-1 px-1 border-l border-stone-300">
          {/* Insert Image Button */}
          <button
            type="button"
            onClick={() => {
              saveSelection();
              setShowImageModal(true);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-stone-900 hover:bg-black text-white rounded-md text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="إدراج صورة في الوصف (من جهازك أو رابط)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
            <span>إضافة صورة</span>
          </button>

          {/* Insert Link Button */}
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
            title="إدراج رابط"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Insert Divider */}
          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            disabled={isHtmlMode}
            className="p-1.5 hover:bg-white rounded-md text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
            title="إدراج خط فاصل أفقي"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Callout & Special Badges Dropdown (YouCan & Storeep secret weapon) */}
        <div className="relative flex items-center px-1 border-l border-stone-300">
          <button
            type="button"
            onClick={() => setShowCalloutMenu(!showCalloutMenu)}
            className="flex items-center gap-1 px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-xs font-bold transition-colors cursor-pointer"
            title="إدراج صناديق ومميزات جاهزة (مثل يوكان وستوريب)"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>عناصر جاهزة</span>
          </button>

          {showCalloutMenu && (
            <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-stone-200 rounded-xl p-2 shadow-xl w-60 space-y-1 text-right">
              <span className="text-[11px] font-bold text-stone-500 block px-2 py-1">
                اختر عنصر لإضافته إلى الوصف:
              </span>
              {CALLOUT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertCallout(preset.html)}
                  className="w-full text-right px-2.5 py-2 hover:bg-stone-50 rounded-lg text-xs font-bold text-stone-800 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{preset.title}</span>
                  {preset.icon === 'shield' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  {preset.icon === 'truck' && <Truck className="w-3.5 h-3.5 text-sky-600" />}
                  {preset.icon === 'flame' && <Flame className="w-3.5 h-3.5 text-red-500" />}
                  {preset.icon === 'table' && <TableIcon className="w-3.5 h-3.5 text-stone-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Mode: Visual vs HTML Source Code */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleHtmlMode}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              isHtmlMode
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'hover:bg-white text-stone-600 hover:text-stone-900 border border-transparent'
            }`}
            title="تبديل عرض كود HTML"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{isHtmlMode ? 'العودة للتحرير المرئي' : 'كود HTML'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-white rounded-md text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            title={isFullscreen ? 'تصغير' : 'تكبير ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. IMAGE FORMATTING QUICK ACTIONS (Appears when clicking an inserted image) */}
      {selectedImgEl && (
        <div className="bg-stone-900 text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn select-none border-b border-stone-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-300 text-[11px]">تحكم بالصورة:</span>
            
            {/* Width */}
            <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded border border-stone-700">
              <button
                type="button"
                onClick={() => setImgWidth('100%')}
                className="px-2 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setImgWidth('70%')}
                className="px-2 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer"
              >
                70%
              </button>
              <button
                type="button"
                onClick={() => setImgWidth('40%')}
                className="px-2 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer"
              >
                40%
              </button>
            </div>

            {/* Radius */}
            <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded border border-stone-700">
              <span className="text-[10px] text-stone-400 px-1">الحواف:</span>
              <button
                type="button"
                onClick={() => setImgRadiusDirect('0px')}
                className="px-1.5 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer text-amber-300"
                title="حواف حادة مستقيمة بدون دوران"
              >
                حادة 0px
              </button>
              <button
                type="button"
                onClick={() => setImgRadiusDirect('12px')}
                className="px-1.5 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer text-teal-300"
                title="حواف دائرية ناعمة"
              >
                دائرية 12px
              </button>
            </div>

            {/* Spacing / Vertical stacking */}
            <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded border border-stone-700">
              <span className="text-[10px] text-stone-400 px-1">المسافة:</span>
              <button
                type="button"
                onClick={() => setImgSpacingDirect('seamless')}
                className="px-1.5 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer text-emerald-300"
                title="متلاصقة تماماً بدون أي فراغ عمودي (0px)"
              >
                متلاصقة 0px
              </button>
              <button
                type="button"
                onClick={() => setImgSpacingDirect('normal')}
                className="px-1.5 py-0.5 rounded hover:bg-stone-700 text-[10px] font-bold cursor-pointer text-stone-300"
                title="مسافة عادية 16px"
              >
                عادية 16px
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={removeSelectedImg}
            className="flex items-center gap-1 text-rose-300 hover:text-rose-100 font-bold text-[11px] cursor-pointer bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف الصورة</span>
          </button>
        </div>
      )}

      {/* 3. MAIN EDITOR CANVAS */}
      <div className={`relative ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
        {isHtmlMode ? (
          <textarea
            value={htmlContent}
            onChange={handleHtmlCodeChange}
            className="w-full p-4 font-mono text-xs text-stone-800 bg-stone-900 text-stone-100 focus:outline-none resize-y"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
            placeholder="<html>اكتب أو الصق كود HTML هنا...</html>"
            dir="ltr"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorChange}
            onClick={(e) => {
              handleEditorClick(e);
              saveSelection();
            }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onSelect={saveSelection}
            onPaste={() => setTimeout(saveSelection, 0)}
            className="p-4 focus:outline-none text-stone-800 text-sm leading-relaxed prose prose-stone max-w-none text-right font-['Cairo']"
            style={{
              minHeight: isFullscreen ? '100%' : minHeight,
              direction: 'rtl',
            }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* 4. FOOTER STATUS BAR */}
      <div className="bg-stone-50 border-t border-stone-200 px-3 py-1.5 flex items-center justify-between text-[11px] text-stone-500">
        <div className="flex items-center gap-2">
          <span>محرر متقدم (يدعم النصوص، الصور، الجداول، والتنسيقات الكاملة)</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>{htmlContent.replace(/<[^>]+>/g, '').trim().length} حرف</span>
        </div>
      </div>

      {/* 5. INSERT IMAGE MODAL (Device Upload or Image URL) */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-right animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-700" />
                <span>إدراج صورة داخل وصف المنتج</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Upload vs URL */}
            <div className="flex border-b border-stone-200">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  imageTab === 'upload'
                    ? 'border-teal-700 text-teal-800'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                رفع من جهازك (مباشر)
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  imageTab === 'url'
                    ? 'border-teal-700 text-teal-800'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                رابط صورة خارجي (URL)
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div className="space-y-3 py-2">
                <label className="border-2 border-dashed border-stone-300 hover:border-teal-600 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50 hover:bg-teal-50/50 transition-all">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
                      <span className="text-xs font-bold text-stone-700">جاري معالجة ورفع الصورة...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        اضغط هنا لاختيار صورة من حاسوبك أو هاتفك
                      </span>
                      <span className="text-[11px] text-stone-400">يدعم PNG, JPG, WEBP, GIF</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={handleUploadImageFile}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    أدخل رابط الصورة المباشر:
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/product-banner.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-left font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => insertImageTag(imageUrlInput)}
                  disabled={!imageUrlInput.trim()}
                  className="w-full py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors"
                >
                  إدراج الصورة في الوصف
                </button>
              </div>
            )}

            {/* Image Styling & Spacing Controls */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2.5 text-right">
              {/* Border radius */}
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  دائرية حواف الصورة (Border Radius):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImgRadius('sharp')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      imgRadius === 'sharp'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    حادة (0px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgRadius('rounded')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      imgRadius === 'rounded'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    دائرية (12px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgRadius('pill')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      imgRadius === 'pill'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    كبسولة (24px)
                  </button>
                </div>
              </div>

              {/* Spacing & Vertical Stacking */}
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  المسافة والالتصاق بين الصور:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImgSpacing('seamless')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      imgSpacing === 'seamless'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    متلاصقة (0px بدون أي فراغ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgSpacing('normal')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      imgSpacing === 'normal'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    مسافة عادية (16px)
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  اختر "متلاصقة 0px" إذا أردت جعل صورتين أو أكثر متصلتين مباشرة واحدة أسفل الأخرى كصورة واحدة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. INSERT LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-right animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
              <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>إدراج رابط في النص</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">نص الرابط:</label>
              <input
                type="text"
                placeholder="مثال: اضغط هنا لمعرفة المزيد"
                value={linkTextInput}
                onChange={(e) => setLinkTextInput(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs text-right"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">عنوان الرابط (URL):</label>
              <input
                type="url"
                placeholder="https://..."
                value={linkUrlInput}
                onChange={(e) => setLinkUrlInput(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs text-left font-mono"
                dir="ltr"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrlInput.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                إضافة الرابط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
