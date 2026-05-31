// Programmatic Plant SVG Generator for falling back / mock captures
// Generates custom SVGs based on species and growth stages (1 = sprout, 2 = growing, 3 = mature, 4+ = lush/flowering)

export function getMockPlantSVG(speciesId, stage = 2) {
  const potColor = '%237C9D39'; // #7C9D39
  const soilColor = '%232D6514'; // #2D6514
  
  let foliage = '';
  
  if (speciesId === 'monstera') {
    // Monstera split leaf representations
    if (stage === 1) {
      foliage = `
        <!-- Sprout Stem -->
        <path d="M50,80 Q45,60 48,45" stroke="%23528124" stroke-width="3" fill="none" />
        <!-- Sprout leaf -->
        <path d="M48,45 C40,40 45,30 50,25 C55,30 60,40 48,45 Z" fill="%23D5D170" />
      `;
    } else if (stage === 2) {
      foliage = `
        <!-- Stem 1 -->
        <path d="M50,80 Q40,60 35,45" stroke="%23528124" stroke-width="4" fill="none" />
        <path d="M35,45 C25,40 28,25 38,28 C45,30 45,45 35,45 Z" fill="%23D5D170" />
        
        <!-- Stem 2 -->
        <path d="M50,80 Q60,55 65,40" stroke="%23528124" stroke-width="4" fill="none" />
        <path d="M65,40 C75,35 78,20 68,23 C60,25 60,40 65,40 Z" fill="%23AAB952" />
        
        <!-- Main leaf -->
        <path d="M50,80 L50,40" stroke="%232D6514" stroke-width="5" fill="none" />
        <path d="M50,40 Q40,15 25,20 Q35,40 50,45 Q65,40 75,20 Q60,15 50,40 Z" fill="%23528124" />
      `;
    } else {
      // Mature / Lush
      foliage = `
        <!-- Left Leaf -->
        <path d="M50,80 Q30,65 25,45" stroke="%232D6514" stroke-width="4" fill="none" />
        <path d="M25,45 C10,35 15,15 30,20 C40,25 35,50 25,45 Z" fill="%23AAB952" />
        
        <!-- Right Leaf -->
        <path d="M50,80 Q70,65 75,45" stroke="%232D6514" stroke-width="4" fill="none" />
        <path d="M75,45 C90,35 85,15 70,20 C60,25 65,50 75,45 Z" fill="%237C9D39" />
        
        <!-- Large fenestrated center leaf -->
        <path d="M50,80 L50,30" stroke="%23104908" stroke-width="6" fill="none" />
        <path d="M50,30 C30,10 20,-5 50,-10 C80,-5 70,10 50,30 Z" fill="%23528124" />
        <!-- Fenestrations (cutouts) -->
        <ellipse cx="40" cy="10" rx="3" ry="8" fill="%23012D04" transform="rotate(-30 40 10)" />
        <ellipse cx="60" cy="10" rx="3" ry="8" fill="%23012D04" transform="rotate(30 60 10)" />
        <ellipse cx="38" cy="0" rx="2" ry="6" fill="%23012D04" transform="rotate(-30 38 0)" />
        <ellipse cx="62" cy="0" rx="2" ry="6" fill="%23012D04" transform="rotate(30 62 0)" />
      `;
    }
  } else if (speciesId === 'snake') {
    // Snake plant upright sword leaves
    if (stage === 1) {
      foliage = `
        <path d="M50,80 Q47,55 50,35 Q53,55 50,80 Z" fill="%237C9D39" stroke="%23D5D170" stroke-width="1.5" />
      `;
    } else if (stage === 2) {
      foliage = `
        <path d="M47,80 Q40,50 45,25 Q50,50 47,80 Z" fill="%23528124" stroke="%23AAB952" stroke-width="1.5" />
        <path d="M53,80 Q60,50 55,25 Q50,50 53,80 Z" fill="%237C9D39" stroke="%23D5D170" stroke-width="1.5" />
        <path d="M50,80 Q48,40 50,15 Q52,40 50,80 Z" fill="%23528124" stroke="%23AAB952" stroke-width="2" />
      `;
    } else {
      foliage = `
        <path d="M42,80 Q30,45 38,20 Q44,45 42,80 Z" fill="%232D6514" stroke="%23AAB952" stroke-width="1.5" />
        <path d="M58,80 Q70,45 62,20 Q56,45 58,80 Z" fill="%232D6514" stroke="%23AAB952" stroke-width="1.5" />
        <path d="M48,80 Q40,35 46,10 Q52,35 48,80 Z" fill="%23528124" stroke="%23D5D170" stroke-width="2" />
        <path d="M52,80 Q60,35 54,10 Q48,35 52,80 Z" fill="%237C9D39" stroke="%23D5D170" stroke-width="2" />
        <path d="M50,80 Q50,30 50,2 Q50,30 50,80 Z" fill="%23104908" stroke="%23D5D170" stroke-width="2" />
      `;
    }
  } else if (speciesId === 'fig') {
    // Fiddle Leaf Fig broad fiddle leaves
    if (stage === 1) {
      foliage = `
        <path d="M50,80 L50,50" stroke="%23528124" stroke-width="4" />
        <path d="M50,50 C40,45 40,35 50,30 C60,35 60,45 50,50 Z" fill="%23528124" stroke="%23AAB952" stroke-width="1" />
      `;
    } else if (stage === 2) {
      foliage = `
        <path d="M50,80 L50,30" stroke="%232D6514" stroke-width="5" />
        <!-- Bottom left leaf -->
        <path d="M50,65 Q35,60 30,50 C28,40 38,40 50,55" fill="%23528124" />
        <!-- Bottom right leaf -->
        <path d="M50,65 Q65,60 70,50 C72,40 62,40 50,55" fill="%23528124" />
        <!-- Top left leaf -->
        <path d="M50,45 Q30,35 25,20 C22,10 35,12 50,35" fill="%237C9D39" />
        <!-- Top right leaf -->
        <path d="M50,45 Q70,35 75,20 C78,10 65,12 50,35" fill="%237C9D39" />
      `;
    } else {
      foliage = `
        <path d="M50,80 L50,15" stroke="%23104908" stroke-width="6" />
        <!-- Low leaves -->
        <path d="M50,70 C25,65 20,45 40,50" fill="%232D6514" stroke="%23528124" stroke-width="1" />
        <path d="M50,70 C75,65 80,45 60,50" fill="%232D6514" stroke="%23528124" stroke-width="1" />
        <!-- Mid leaves -->
        <path d="M50,50 C20,40 15,20 38,30" fill="%23528124" stroke="%237C9D39" stroke-width="1" />
        <path d="M50,50 C80,40 85,20 62,30" fill="%23528124" stroke="%237C9D39" stroke-width="1" />
        <!-- Top crowning leaves -->
        <path d="M50,30 C30,15 25,-5 48,-2" fill="%237C9D39" stroke="%23AAB952" stroke-width="1.5" />
        <path d="M50,30 C70,15 75,-5 52,-2" fill="%237C9D39" stroke="%23AAB952" stroke-width="1.5" />
        <path d="M50,20 C45,0 55,0 50,-10 C45,0 55,0 50,20 Z" fill="%23D5D170" />
      `;
    }
  } else if (speciesId === 'pothos') {
    // Pothos hanging vines
    if (stage === 1) {
      foliage = `
        <path d="M50,80 Q45,65 40,68" stroke="%23528124" stroke-width="2" fill="none" />
        <path d="M40,68 C35,68 33,60 38,58 C43,56 42,65 40,68 Z" fill="%23AAB952" />
      `;
    } else if (stage === 2) {
      foliage = `
        <!-- Vines trailing down left and right -->
        <path d="M55,80 Q65,90 60,105 Q55,120 63,130" stroke="%23528124" stroke-width="2.5" fill="none" />
        <path d="M45,80 Q35,88 40,100 Q45,112 37,125" stroke="%23528124" stroke-width="2.5" fill="none" />
        
        <!-- Center bush -->
        <path d="M50,80 Q40,65 35,55" stroke="%23528124" stroke-width="3" fill="none" />
        <path d="M35,55 C25,50 30,35 40,40 Z" fill="%237C9D39" />
        <path d="M50,80 Q60,65 65,55" stroke="%23528124" stroke-width="3" fill="none" />
        <path d="M65,55 C75,50 70,35 60,40 Z" fill="%23AAB952" />
        
        <!-- Vine leaves -->
        <path d="M60,105 C68,105 65,98 60,105 Z" fill="%23D5D170" />
        <path d="M40,100 C32,100 35,92 40,100 Z" fill="%237C9D39" />
        <path d="M63,130 C70,128 67,122 63,130 Z" fill="%23AAB952" />
        <path d="M37,125 C30,123 33,117 37,125 Z" fill="%23D5D170" />
      `;
    } else {
      foliage = `
        <!-- Long Vines -->
        <path d="M55,80 Q70,95 62,115 Q54,135 66,155 Q72,175 60,190" stroke="%232D6514" stroke-width="3" fill="none" />
        <path d="M45,80 Q30,95 38,115 Q46,135 34,155 Q28,175 40,190" stroke="%232D6514" stroke-width="3" fill="none" />
        <path d="M50,80 Q50,110 48,140 Q46,170 52,205" stroke="%23528124" stroke-width="2" fill="none" />
        
        <!-- Top bush -->
        <circle cx="50" cy="70" r="18" fill="%232D6514" opacity="0.6" />
        <path d="M35,65 C20,60 25,40 40,50" fill="%237C9D39" />
        <path d="M65,65 C80,60 75,40 60,50" fill="%23AAB952" />
        <path d="M50,55 C40,35 60,35 50,55 Z" fill="%23D5D170" />
        
        <!-- Leaves along vines -->
        <path d="M62,115 C72,115 70,105 62,115 Z" fill="%23D5D170" />
        <path d="M38,115 C28,115 30,105 38,115 Z" fill="%237C9D39" />
        <path d="M66,155 C76,153 73,145 66,155 Z" fill="%23AAB952" />
        <path d="M34,155 C24,153 27,145 34,155 Z" fill="%23D5D170" />
        <path d="M60,190 C68,188 65,180 60,190 Z" fill="%237C9D39" />
        <path d="M40,190 C32,188 35,180 40,190 Z" fill="%23AAB952" />
        
        <path d="M48,140 C56,138 52,130 48,140 Z" fill="%23D5D170" />
        <path d="M52,205 C44,203 48,195 52,205 Z" fill="%237C9D39" />
      `;
    }
  } else {
    // Succulents (Rosette shapes)
    if (stage === 1) {
      foliage = `
        <ellipse cx="50" cy="72" rx="8" ry="4" fill="%23AAB952" />
        <ellipse cx="46" cy="74" rx="5" ry="3" fill="%23D5D170" />
        <ellipse cx="54" cy="74" rx="5" ry="3" fill="%23D5D170" />
      `;
    } else if (stage === 2) {
      foliage = `
        <ellipse cx="50" cy="72" rx="14" ry="7" fill="%237C9D39" />
        <circle cx="50" cy="70" r="10" fill="%23AAB952" />
        <circle cx="50" cy="70" r="6" fill="%23D5D170" />
        <!-- tips -->
        <circle cx="50" cy="60" r="1.5" fill="%23528124" />
        <circle cx="38" cy="70" r="1.5" fill="%23528124" />
        <circle cx="62" cy="70" r="1.5" fill="%23528124" />
      `;
    } else {
      foliage = `
        <!-- Outer petals -->
        <circle cx="50" cy="70" r="22" fill="%23528124" />
        <!-- Middle petals -->
        <circle cx="50" cy="70" r="17" fill="%237C9D39" />
        <!-- Inner petals -->
        <circle cx="50" cy="70" r="12" fill="%23AAB952" />
        <!-- Center core -->
        <circle cx="50" cy="70" r="7" fill="%23D5D170" />
        
        <!-- Detailed sharp succulent tips -->
        <path d="M50,45 L50,48" stroke="%23104908" stroke-width="2" />
        <path d="M50,95 L50,92" stroke="%23104908" stroke-width="2" />
        <path d="M25,70 L28,70" stroke="%23104908" stroke-width="2" />
        <path d="M75,70 L72,70" stroke="%23104908" stroke-width="2" />
      `;
    }
  }

  // Combine foliage and flowerpot SVG template
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 220" width="100%" height="100%">
      <!-- Background overlay for contrast -->
      <rect width="100" height="220" fill="%23061c05" rx="10" />
      <g>
        ${foliage}
      </g>
      <!-- Soil level -->
      <ellipse cx="50" cy="160" rx="30" ry="10" fill="${soilColor}" />
      
      <!-- Flowerpot Body -->
      <path d="M22,160 L28,210 C29,215 31,217 35,217 L65,217 C69,217 71,215 72,210 L78,160 Z" fill="${potColor}" />
      <!-- Flowerpot Rim -->
      <rect x="18" y="150" width="64" height="10" rx="3" fill="%23AAB952" />
      
      <!-- Grid line / baseline guide for growth -->
      <line x1="10" y1="150" x2="90" y2="150" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
      <text x="50" y="25" fill="rgba(255,255,255,0.15)" font-size="8" text-anchor="middle" font-family="sans-serif">GROWTH LEVEL ${stage}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${svg.replace(/[\n\r]/g, '').trim()}`;
}
