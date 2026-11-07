import React from 'react';

interface FashionIllustrationProps {
  type: 'blazer' | 'dress' | 'coat' | 'shirt' | 'abaya' | 'suit' | 'caftan' | 'djellaba' | 'survette';
  accentColor?: string;
  className?: string;
  customImage?: string;
}

export const FashionIllustration: React.FC<FashionIllustrationProps> = ({
  type,
  accentColor = '#2D3748',
  className = 'w-full h-full',
  customImage,
}) => {
  if (customImage) {
    return (
      <img
        src={customImage}
        alt="Product preview"
        referrerPolicy="no-referrer"
        className={`${className} object-cover`}
        onError={(e) => {
          // Fallback to illustration if image fails
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F7F6F2] to-[#ECEAE3] ${className}`}>
      {/* Subtle luxury geometric backdrop watermark / subtle texture */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#D3CEBF_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Studio spotlight glow */}
      <div className="absolute top-4 w-48 h-48 rounded-full bg-white/70 blur-2xl pointer-events-none" />

      {type === 'blazer' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hanger and neck collar */}
          <path d="M125 72C138 65 182 65 195 72" stroke="#8A8275" strokeWidth="3" strokeLinecap="round" />
          <path d="M160 55V70" stroke="#8A8275" strokeWidth="2.5" />
          {/* Inner shirt collar */}
          <polygon points="160,110 140,80 180,80" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          {/* Main blazer body */}
          <path d="M85 115L120 85L160 130L200 85L235 115L228 320H92L85 115Z" fill={accentColor} />
          {/* Left & Right lapels */}
          <path d="M120 85L160 210L145 220L112 125L120 85Z" fill="#1A202C" fillOpacity="0.15" />
          <path d="M200 85L160 210L175 220L208 125L200 85Z" fill="#1A202C" fillOpacity="0.25" />
          {/* Sleeves */}
          <path d="M85 115L60 270L90 280L102 170L85 115Z" fill={accentColor} />
          <path d="M235 115L260 270L230 280L218 170L235 115Z" fill={accentColor} />
          {/* Seam lines & breast pocket */}
          <line x1="160" y1="210" x2="160" y2="320" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="2" />
          <rect x="110" y="165" width="28" height="6" rx="2" fill="#FFFFFF" fillOpacity="0.25" />
          <rect x="105" y="240" width="36" height="4" rx="1.5" fill="#FFFFFF" fillOpacity="0.2" />
          <rect x="179" y="240" width="36" height="4" rx="1.5" fill="#FFFFFF" fillOpacity="0.2" />
          {/* Tailored horn buttons */}
          <circle cx="160" cy="235" r="4" fill="#E2D9CC" stroke="#8C827A" strokeWidth="1.5" />
          <circle cx="160" cy="265" r="4" fill="#E2D9CC" stroke="#8C827A" strokeWidth="1.5" />
        </svg>
      )}

      {type === 'dress' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Straps / Bodice */}
          <path d="M130 75C140 100 148 120 160 135C172 120 180 100 190 75" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M125 78L138 150L160 165L182 150L195 78L175 75L160 115L145 75L125 78Z" fill={accentColor} />
          {/* Fitted waist band */}
          <path d="M136 150C148 153 172 153 184 150L186 168C172 172 148 172 134 168L136 150Z" fill="#000000" fillOpacity="0.2" />
          {/* Flowing maxi skirt with elegant drape folds */}
          <path d="M134 168C125 220 100 290 85 365C135 372 185 372 235 365C220 290 195 220 186 168Z" fill={accentColor} />
          {/* Silk drape folds */}
          <path d="M152 170C150 230 145 300 140 368" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M168 170C170 230 178 300 182 368" stroke="#000000" strokeOpacity="0.2" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M160 165C160 240 160 300 162 369" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.5" />
          {/* Ribbon tie accent */}
          <ellipse cx="160" cy="165" rx="7" ry="5" fill="#EAD9BD" />
          <path d="M160 167C155 185 150 205 146 225" stroke="#EAD9BD" strokeWidth="2" strokeLinecap="round" />
          <path d="M160 167C165 185 170 205 174 220" stroke="#EAD9BD" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}

      {type === 'coat' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Overcoat collar */}
          <path d="M120 70L160 90L200 70L230 95L220 350H100L90 95L120 70Z" fill={accentColor} />
          {/* Broad wool lapels */}
          <path d="M120 70L160 175L135 185L98 108L120 70Z" fill="#111827" fillOpacity="0.3" />
          <path d="M200 70L160 175L185 185L222 108L200 70Z" fill="#111827" fillOpacity="0.2" />
          {/* Long tailored sleeves */}
          <path d="M90 95L65 295L95 300L108 170L90 95Z" fill={accentColor} />
          <path d="M230 95L255 295L225 300L212 170L230 95Z" fill={accentColor} />
          {/* Double breasted buttons */}
          <circle cx="145" cy="200" r="4.5" fill="#C5BAA8" />
          <circle cx="175" cy="200" r="4.5" fill="#C5BAA8" />
          <circle cx="145" cy="235" r="4.5" fill="#C5BAA8" />
          <circle cx="175" cy="235" r="4.5" fill="#C5BAA8" />
          <circle cx="145" cy="270" r="4.5" fill="#C5BAA8" />
          <circle cx="175" cy="270" r="4.5" fill="#C5BAA8" />
          {/* Slant pockets */}
          <line x1="108" y1="260" x2="135" y2="250" stroke="#000000" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
          <line x1="212" y1="260" x2="185" y2="250" stroke="#000000" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {type === 'abaya' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Modern luxury abaya with embroidered borders */}
          <path d="M125 65C140 60 180 60 195 65L245 105L230 365H90L75 105L125 65Z" fill={accentColor} />
          {/* Wide kimonos/batwing sleeves */}
          <path d="M75 105L45 240L80 250L98 170L75 105Z" fill={accentColor} />
          <path d="M245 105L275 240L240 250L222 170L245 105Z" fill={accentColor} />
          {/* Embroidered gold/champagne center panel */}
          <rect x="156" y="65" width="8" height="300" fill="#D4AF37" fillOpacity="0.8" />
          <path d="M156 65L145 110L175 110L164 65" fill="#C5A059" fillOpacity="0.6" />
          {/* Sleeve embroidery cuffs */}
          <rect x="45" y="235" width="35" height="8" rx="2" fill="#D4AF37" fillOpacity="0.8" />
          <rect x="240" y="235" width="35" height="8" rx="2" fill="#D4AF37" fillOpacity="0.8" />
        </svg>
      )}

      {type === 'shirt' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crisp collar */}
          <path d="M130 75L160 100L190 75L178 68L160 80L142 68L130 75Z" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
          {/* Body */}
          <path d="M110 95L140 75L180 75L210 95L200 300H120L110 95Z" fill={accentColor} />
          {/* Sleeves */}
          <path d="M110 95L80 240L108 245L125 150L110 95Z" fill={accentColor} />
          <path d="M210 95L240 240L212 245L195 150L210 95Z" fill={accentColor} />
          {/* Center placket with pearlescent buttons */}
          <line x1="160" y1="100" x2="160" y2="300" stroke="#000000" strokeOpacity="0.15" strokeWidth="12" />
          <circle cx="160" cy="120" r="3" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
          <circle cx="160" cy="155" r="3" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
          <circle cx="160" cy="190" r="3" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
          <circle cx="160" cy="225" r="3" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
          <circle cx="160" cy="260" r="3" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="1" />
          {/* Chest patch pocket */}
          <rect x="126" y="140" width="22" height="26" rx="2" fill="#FFFFFF" fillOpacity="0.1" stroke="#000000" strokeOpacity="0.1" />
        </svg>
      )}

      {type === 'suit' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Crisp dress shirt & tie */}
          <polygon points="160,110 142,75 178,75" fill="#FFFFFF" />
          <polygon points="160,85 155,95 160,165 165,95" fill="#991B1B" />
          {/* Bespoke Jacket */}
          <path d="M92 110L125 80L160 145L195 80L228 110L222 315H98L92 110Z" fill={accentColor} />
          {/* Satin peaked lapels */}
          <path d="M125 80L160 215L148 225L115 125L125 80Z" fill="#0F172A" fillOpacity="0.3" />
          <path d="M195 80L160 215L172 225L205 125L195 80Z" fill="#0F172A" fillOpacity="0.25" />
          {/* Sleeves */}
          <path d="M92 110L68 265L96 275L108 165L92 110Z" fill={accentColor} />
          <path d="M228 110L252 265L224 275L212 165L228 110Z" fill={accentColor} />
          {/* Pocket square */}
          <rect x="114" y="160" width="24" height="4" rx="1" fill="#FFFFFF" />
          <polygon points="120,160 126,150 132,160" fill="#FFFFFF" />
          {/* Center horn button */}
          <circle cx="160" cy="245" r="4" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1" />
        </svg>
      )}

      {type === 'caftan' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Moroccan Caftan with Golden Sfifa & Aqqad */}
          <path d="M125 60C140 55 180 55 195 60L245 95L232 370H88L75 95L125 60Z" fill={accentColor} />
          {/* Wide Caftan Sleeves */}
          <path d="M75 95L45 235L80 245L98 165L75 95Z" fill={accentColor} />
          <path d="M245 95L275 235L240 245L222 165L245 95Z" fill={accentColor} />
          {/* Center Golden Sfifa line */}
          <rect x="156" y="60" width="8" height="310" fill="#F59E0B" />
          {/* Moroccan Aqqad buttons */}
          {[90, 115, 140, 165, 190, 215, 240, 265, 290, 315].map((y) => (
            <circle key={y} cx="160" cy={y} r="3" fill="#FEF08A" stroke="#B45309" strokeWidth="1" />
          ))}
          {/* Mdamma (Golden Moroccan Belt) */}
          <rect x="125" y="180" width="70" height="14" rx="3" fill="#D97706" stroke="#FEF08A" strokeWidth="1.5" />
          <circle cx="160" cy="187" r="4" fill="#B91C1C" />
          {/* Sleeve Sfifa embroidery */}
          <rect x="45" y="230" width="35" height="8" rx="2" fill="#F59E0B" />
          <rect x="240" y="230" width="35" height="8" rx="2" fill="#F59E0B" />
        </svg>
      )}

      {type === 'djellaba' && (
        <svg viewBox="0 0 320 400" className="w-[82%] h-[82%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Moroccan Djellaba with Kob (Hood) */}
          <path d="M120 70C135 60 185 60 200 70L240 100L228 370H92L80 100L120 70Z" fill={accentColor} />
          {/* Pointed Hood (Kob) draped behind */}
          <path d="M135 70L160 35L185 70L160 115Z" fill="#1E293B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1" />
          {/* Sleeves */}
          <path d="M80 100L55 240L85 248L100 170L80 100Z" fill={accentColor} />
          <path d="M240 100L265 240L235 248L220 170L240 100Z" fill={accentColor} />
          {/* Center Randa / Sfifa embroidery */}
          <line x1="160" y1="70" x2="160" y2="370" stroke="#F59E0B" strokeWidth="6" />
          {/* Aqqad */}
          {[100, 130, 160, 190, 220, 250, 280, 310].map((y) => (
            <circle key={y} cx="160" cy={y} r="2.5" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
          ))}
          {/* Shousha (Tassel) on the hood */}
          <line x1="160" y1="35" x2="160" y2="25" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="160" cy="23" r="3" fill="#D97706" />
        </svg>
      )}

      {type === 'survette' && (
        <svg viewBox="0 0 320 400" className="w-[84%] h-[84%] relative z-10 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* DEFINITIONS for Metallic Zipper Gradients */}
          <defs>
            <linearGradient id="silverZipGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="35%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="metalRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="fabricShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* 1. MATCHING STRAIGHT TROUSERS (Pants Behind Jacket) */}
          <path
            d="M112 210 L104 365 C104 368 108 370 114 370 L146 370 C150 370 152 368 152 365 L156 260 L164 260 L168 365 C168 368 170 370 174 370 L206 370 C212 370 216 368 216 365 L208 210 Z"
            fill={accentColor}
          />
          {/* Trouser Inseam & Hem Shading */}
          <path
            d="M112 210 L104 365 C104 368 108 370 114 370 L146 370 C150 370 152 368 152 365 L156 260 L164 260 L168 365 C168 368 170 370 174 370 L206 370 C212 370 216 368 216 365 L208 210 Z"
            fill="url(#fabricShadeGrad)"
          />
          {/* Crotch Crease */}
          <path d="M160 258 L160 280" stroke="#000000" strokeOpacity="0.25" strokeWidth="1.5" />
          {/* Trouser Hem Accents */}
          <line x1="104" y1="365" x2="152" y2="365" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />
          <line x1="168" y1="365" x2="216" y2="365" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1" />

          {/* 2. HOOD (Capuche - Draped Behind Neck) */}
          <path
            d="M120 78 C110 52 140 40 160 40 C180 40 210 52 200 78 C190 92 130 92 120 78 Z"
            fill={accentColor}
            stroke="#000000"
            strokeOpacity="0.15"
            strokeWidth="1.5"
          />
          <path
            d="M130 76 C138 58 152 50 160 50 C168 50 182 58 190 76"
            stroke="#000000"
            strokeOpacity="0.25"
            strokeWidth="2"
            fill="none"
          />

          {/* 3. MAIN HOODIE BODY (Survette Top) */}
          <path
            d="M102 100 L125 76 C138 72 182 72 195 76 L218 100 L214 248 C214 252 210 255 204 255 L116 255 C110 255 106 252 106 248 L102 100 Z"
            fill={accentColor}
          />
          {/* Soft Fabric Gradient Depth */}
          <path
            d="M102 100 L125 76 C138 72 182 72 195 76 L218 100 L214 248 C214 252 210 255 204 255 L116 255 C110 255 106 252 106 248 L102 100 Z"
            fill="url(#fabricShadeGrad)"
          />

          {/* 4. SLEEVES (Drop Shoulder with Cuff Buttons) */}
          {/* Left Sleeve */}
          <path
            d="M102 100 L72 210 C70 215 74 220 80 220 L96 220 C100 220 104 216 106 212 L116 150 L102 100 Z"
            fill={accentColor}
          />
          <path
            d="M102 100 L72 210 C70 215 74 220 80 220 L96 220 C100 220 104 216 106 212 L116 150 L102 100 Z"
            fill="url(#fabricShadeGrad)"
          />
          {/* Left Cuff & Signature Button */}
          <line x1="72" y1="212" x2="98" y2="212" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <circle cx="86" cy="216" r="2.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />

          {/* Right Sleeve */}
          <path
            d="M218 100 L248 210 C250 215 246 220 240 220 L224 220 C220 220 216 216 214 212 L204 150 L218 100 Z"
            fill={accentColor}
          />
          <path
            d="M218 100 L248 210 C250 215 246 220 240 220 L224 220 C220 220 216 216 214 212 L204 150 L218 100 Z"
            fill="url(#fabricShadeGrad)"
          />
          {/* Right Cuff & Signature Button */}
          <line x1="222" y1="212" x2="248" y2="212" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <circle cx="234" cy="216" r="2.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />

          {/* 5. FRONT POCKETS (Kangaroo / Slant side pockets) */}
          <path
            d="M112 185 C116 182 135 182 142 195 L144 246 L112 246 Z"
            fill="#000000"
            fillOpacity="0.1"
            stroke="#FFFFFF"
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          <path
            d="M208 185 C204 182 185 182 178 195 L176 246 L208 246 Z"
            fill="#000000"
            fillOpacity="0.1"
            stroke="#FFFFFF"
            strokeOpacity="0.2"
            strokeWidth="1"
          />

          {/* 6. HOOD DRAWSTRINGS (Cordons de capuche) */}
          <path d="M145 78 Q140 115 142 145" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="140" y="145" width="4" height="6" rx="1" fill="#94A3B8" />

          <path d="M175 78 Q180 115 178 145" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="176" y="145" width="4" height="6" rx="1" fill="#94A3B8" />

          {/* 7. METALLIC SILVER ZIPPER (Full front center) */}
          <line x1="160" y1="74" x2="160" y2="255" stroke="url(#silverZipGrad)" strokeWidth="3.5" />
          <line x1="160" y1="74" x2="160" y2="255" stroke="#475569" strokeWidth="0.8" strokeDasharray="1,1" />

          {/* 8. ICONIC SIGNATURE CIRCULAR O-RING ZIPPER PULL TAB */}
          <circle cx="160" cy="115" r="8" fill="none" stroke="url(#metalRingGrad)" strokeWidth="2.8" />
          <rect x="158" y="102" width="4" height="6" rx="1" fill="url(#metalRingGrad)" />

          {/* Bottom Hem Band */}
          <line x1="106" y1="248" x2="214" y2="248" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.5" />
        </svg>
      )}

      {/* Floating brand signature label badge */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest text-[#0f766e] uppercase">
        EGASA
      </div>
    </div>
  );
};
