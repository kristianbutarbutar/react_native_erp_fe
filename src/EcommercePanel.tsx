import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import ProductPanel from './ecom/ProductPanel';

// --- Color Palette Constants (60-30-10 Rule) ---
const PALETTE = {
  blue: '#4A6984',
  beige: '#F5F2EB',
  sage: '#8F9E8B',
  white: '#FFFFFF',
  textDark: '#1A232A',
  textLight: '#F5F2EB',
};

interface EcommercePanelProps {
  subdomain?: string;
  domain?: string;
  domainFunc: (dm: string) => void;
}

export const EcommercePanel: React.FC<EcommercePanelProps> = ({ domainFunc, subdomain, domain }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Active palette background state
  const [themeColor, setThemeColor] = useState<string>(PALETTE.beige);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Dynamic contrast colors depending on selected theme
  const isDarkTheme = themeColor === PALETTE.blue;
  const textColor = isDarkTheme ? PALETTE.textLight : PALETTE.textDark;

  return (
    <View style={[styles.container, { backgroundColor: themeColor }]}>
      {/* Top 1 Box Header */}
      <View style={[styles.top1Box, { backgroundColor: themeColor }]}>
        {/* Top 1 Box Left */}
        <View style={styles.top1BoxLeft}>
          {/* Color Switcher Buttons */}
          <View style={styles.colorPaletteGroup}>
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.blue },
                themeColor === PALETTE.blue && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.blue)}
              accessibilityLabel="Set theme to Slate Blue"
            />
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.beige },
                themeColor === PALETTE.beige && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.beige)}
              accessibilityLabel="Set theme to Warm Beige"
            />
            <TouchableOpacity
              style={[
                styles.colorBtn,
                { backgroundColor: PALETTE.sage },
                themeColor === PALETTE.sage && styles.colorBtnActive,
              ]}
              onPress={() => setThemeColor(PALETTE.sage)}
              accessibilityLabel="Set theme to Sage Green"
            />
          </View>

          {/* Brand Logo Video Integration */}
          <View style={styles.headerVideoContainer}>
            {Platform.OS === 'web' ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  height: '18px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  background: 'transparent',
                }}
              >
                <source src="brand_logo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Text style={[styles.logoFallbackText, { color: textColor }]}>BRAND</Text>
            )}
          </View>
        </View>

        {/* Top 1 Box Right */}
        <View style={styles.top1BoxRight}>
          {/* Indonesia Flag */}
          <View style={styles.flagContainer}>
            <View style={styles.flagRed} />
            <View style={styles.flagWhite} />
          </View>

          {/* New Portal & Demo Navigation Links */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => domainFunc('customer portal')}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Portal</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => domainFunc('management')}
          >
            <Text style={styles.menuIcon}>💻</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Demo</Text>}
          </TouchableOpacity>

          {/* Existing Navigation Menu Links */}
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🛒</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Cart</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👤</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Me</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💬</Text>
            {isDesktop && <Text style={[styles.menuText, { color: textColor }]}>Chat</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 2 Box Banner */}
      <View style={[styles.top2Box, { backgroundColor: themeColor }]}>
        <Text style={[styles.top2BoxText, { color: textColor }]} numberOfLines={1}>
          ⚡ 60-30-10 Palette Ratio: Dynamic Global Color Selection
        </Text>
      </View>

      {/* Main Content Area */}
      <View style={[styles.mainBody, !isDesktop && styles.mainBodyMobile]}>
        {/* Content Box Left - Visible only on Desktop */}
        {isDesktop && (
          <View
            style={[
              styles.contentBoxLeft,
              { backgroundColor: PALETTE.white },
            ]}
          />
        )}

        {/* Content Box (Center Workspace) - Positioned at top */}
        <View
          style={[
            styles.contentBox,
            !isDesktop && styles.fullWidth,
            { backgroundColor: PALETTE.white },
          ]}
        >
          <ProductPanel />
        </View>

        {/* Content Box Right - Visible only on Desktop */}
        {isDesktop && (
          <View
            style={[
              styles.contentBoxRight,
              { backgroundColor: PALETTE.white },
            ]}
          />
        )}
      </View>

      {/* Footer Box */}
      <View style={[styles.footer, { backgroundColor: themeColor }]}>
        <Text style={[styles.footerText, { color: textColor }]} numberOfLines={1}>
          © 2026 amgreat.id
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    width: '100%',
    padding: 6,
    gap: 4,
    overflow: 'hidden',
  },

  // --- Top 1 Box ---
  top1Box: {
    height: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 0,
  },
  top1BoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPaletteGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 0,
  },
  colorBtnActive: {
    transform: [{ scale: 1.25 }],
  },
  headerVideoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  top1BoxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagContainer: {
    width: 18,
    height: 12,
    borderWidth: 0,
    overflow: 'hidden',
  },
  flagRed: {
    flex: 1,
    backgroundColor: '#FF0000',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuIcon: {
    fontSize: 12,
  },
  menuText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Top 2 Box ---
  top2Box: {
    height: 28,
    borderRadius: 6,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  top2BoxText: {
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },

  // --- Main Content Area ---
  mainBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  mainBodyMobile: {
    flexDirection: 'column',
  },
  contentBoxLeft: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 0,
  },
  contentBox: {
    flex: 3,
    borderRadius: 6,
    borderWidth: 0,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  contentBoxRight: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 0,
  },
  fullWidth: {
    width: '100%',
    flex: 1,
  },

  // --- Footer Box ---
  footer: {
    height: 28,
    borderRadius: 6,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 11,
  },
});

export default EcommercePanel;