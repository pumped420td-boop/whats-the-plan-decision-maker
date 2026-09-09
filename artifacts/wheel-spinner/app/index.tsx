import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, G, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Category = 'meals' | 'exercise' | 'weekends';
type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'custom';
type MenuSection = 'overview' | 'privacy' | 'terms' | 'support' | 'playStore';

type WheelConfig = {
  id: string;
  title: string;
  subtitle: string;
  choices: string[];
  color: string;
};

const MEALS: Record<Exclude<MealKey, 'custom'>, WheelConfig> = {
  breakfast: {
    id: 'breakfast',
    title: 'Breakfast',
    subtitle: 'Start the day deliciously',
    choices: [
      'Pancakes',
      'French toast',
      'Omelet',
      'Biscuit & gravy',
      'Avocado toast',
      'Breakfast burrito',
      'Oatmeal',
      'Eggs & toast',
      'Smoothie bowl',
      'Breakfast sandwich',
      'Hash browns',
      'Fruit & yogurt',
    ],
    color: '#F28C52',
  },
  lunch: {
    id: 'lunch',
    title: 'Lunch',
    subtitle: 'Your midday decision, made easy',
    choices: [
      'Tacos',
      'Sushi',
      'Burger',
      'Salad',
      'Ramen',
      'Pizza',
      'Sandwich',
      'Poke bowl',
      'Quesadilla',
      'Soup',
      'Gyro',
      'Chicken tenders',
    ],
    color: '#42A7A5',
  },
  dinner: {
    id: 'dinner',
    title: 'Dinner',
    subtitle: 'Let the wheel pick tonight',
    choices: [
      'Thai curry',
      'Pasta',
      'Steak',
      'Fish & chips',
      'Stir fry',
      'Order in',
      'Tacos',
      'Pizza night',
      'Roast chicken',
      'Burgers',
      'Sushi',
      'Grilled salmon',
    ],
    color: '#5B8DEF',
  },
};

const EXERCISE: WheelConfig = {
  id: 'exercise',
  title: 'Move your body',
  subtitle: 'A little movement goes a long way',
  choices: [
    'Walk',
    'Run',
    'Yoga',
    'Cycle',
    'Push-ups',
    'Squats',
    'Lunges',
    'Jumping jacks',
    'Plank',
    'Burpees',
    'Crunches',
    'High knees',
  ],
  color: '#83B86B',
};

const WEEKENDS: WheelConfig = {
  id: 'weekends',
  title: 'Weekend plans',
  subtitle: 'Make the most of your days off',
  choices: [
    'Go to the movies',
    'Head to the lake',
    'Go fishing',
    'Go skiing',
    'Watch drag races',
    'Go camping',
    'Visit a museum',
    'Try a new restaurant',
    'Take a road trip',
    'Go to a concert',
    'Have a game night',
    'Explore a nearby town',
  ],
  color: '#E97451',
};

const WHEEL_COLORS = ['#F05B63', '#F28C52', '#F6C65B', '#83B86B', '#42A7A5', '#5B8DEF'];
const STORAGE_KEY = '@wheel-spinner/custom-options';
const SCREEN_WIDTH = Dimensions.get('window').width;
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 56, 340);

function polarToCartesian(center: number, angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function slicePath(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, endAngle, radius);
  const end = polarToCartesian(center, startAngle, radius);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function Wheel({
  choices,
  spinning,
  onSpin,
  result,
}: {
  choices: string[];
  spinning: boolean;
  onSpin: (winner: number) => void;
  result: string | null;
}) {
  const colors = useColors();
  const rotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const [layoutSize, setLayoutSize] = useState(WHEEL_SIZE);
  const center = layoutSize / 2;
  const radius = center - 7;
  const segmentAngle = 360 / Math.max(choices.length, 1);
  const wheelRotation = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const spinWheel = () => {
    if (spinning || choices.length === 0) return;
    const winner = Math.floor(Math.random() * choices.length);
    onSpin(winner);
    const targetOffset = 360 - winner * segmentAngle - segmentAngle / 2;
    const nextRotation = currentRotation.current + 360 * 5 + targetOffset;
    currentRotation.current = nextRotation;
    Animated.timing(rotation, {
      toValue: nextRotation,
      duration: 3600,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.wheelStage}>
      <View style={styles.pointerShadow} />
      <View style={[styles.pointer, { borderBottomColor: colors.primary }]} />
      <Pressable
        accessibilityLabel="Spin wheel"
        testID="spin-wheel"
        onPress={spinWheel}
        disabled={spinning || choices.length === 0}
        style={({ pressed }) => [styles.wheelPressable, pressed && styles.pressed]}
        onLayout={(event) => setLayoutSize(event.nativeEvent.layout.width)}
      >
        <Animated.View style={{ transform: [{ rotate: wheelRotation }] }}>
          <Svg width={layoutSize} height={layoutSize} viewBox={`0 0 ${layoutSize} ${layoutSize}`}>
            <Circle cx={center} cy={center} r={radius} fill={colors.surfaceSoft} />
            {choices.map((choice, index) => {
              const start = index * segmentAngle;
              const end = start + segmentAngle;
              const labelAngle = start + segmentAngle / 2;
              const labelPoint = polarToCartesian(center, labelAngle, radius * 0.64);
              const readableAngle = labelAngle > 90 && labelAngle < 270 ? labelAngle + 180 : labelAngle;
              const fontSize = choices.length > 11 ? 9 : choices.length > 7 ? 10 : choices.length > 5 ? 11 : 12;
              const label = choice.length > 13 ? `${choice.slice(0, 12)}…` : choice;
              return (
                <G key={`${choice}-${index}`}>
                  <Path
                    d={slicePath(center, radius, start, end)}
                    fill={WHEEL_COLORS[index % WHEEL_COLORS.length]}
                    stroke={colors.background}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={labelPoint.x}
                    y={labelPoint.y}
                    fill={colors.primaryForeground}
                    fontSize={fontSize}
                    fontWeight="700"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${readableAngle} ${labelPoint.x} ${labelPoint.y})`}
                  >
                    {label}
                  </SvgText>
                </G>
              );
            })}
            <Circle cx={center} cy={center} r={26} fill={colors.background} stroke={colors.primary} strokeWidth={3} />
            <Circle cx={center} cy={center} r={7} fill={colors.primary} />
          </Svg>
        </Animated.View>
      </Pressable>
      <Pressable
        testID="spin-button"
        onPress={spinWheel}
        disabled={spinning || choices.length === 0}
        style={({ pressed }) => [
          styles.spinButton,
          { backgroundColor: spinning ? colors.muted : colors.primary },
          pressed && styles.buttonPressed,
        ]}
      >
        <Feather name={spinning ? 'loader' : 'rotate-cw'} size={18} color={spinning ? colors.mutedForeground : colors.primaryForeground} />
        <Text style={[styles.spinButtonText, { color: spinning ? colors.mutedForeground : colors.primaryForeground }]}>
          {spinning ? 'Spinning…' : 'Spin the wheel'}
        </Text>
      </Pressable>
      {result ? (
        <View style={[styles.resultPill, { borderColor: colors.border }]}>
          <Text style={styles.resultEyebrow}>THE WHEEL CHOSE</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : (
        <Text style={styles.spinHint}>Tap the wheel or button to decide</Text>
      )}
    </View>
  );
}

function CategoryTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      testID={`tab-${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryTab,
        { backgroundColor: active ? colors.primary : colors.surfaceRaised },
        pressed && styles.pressed,
      ]}
    >
      <Feather name={icon} size={16} color={active ? colors.primaryForeground : colors.mutedForeground} />
      <Text style={[styles.categoryTabText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function ShareButton({ result, label = 'Share result' }: { result: string | null; label?: string }) {
  const colors = useColors();
  const share = async () => {
    if (!result) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: 'My Wheel Spinner result',
      message: `The wheel picked ${result}! Try your luck with Wheel Spinner.`,
    });
  };
  return (
    <Pressable
      testID="share-result"
      onPress={share}
      disabled={!result}
      style={({ pressed }) => [
        styles.shareButton,
        { borderColor: colors.border, opacity: result ? 1 : 0.45 },
        pressed && styles.pressed,
      ]}
    >
      <Feather name="share-2" size={16} color={colors.primary} />
      <Text style={[styles.shareButtonText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export default function Index() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>('meals');
  const [meal, setMeal] = useState<MealKey>('breakfast');
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ label: string; value: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<MenuSection>('overview');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setCustomOptions(JSON.parse(stored) as string[]);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customOptions)).catch(() => undefined);
  }, [customOptions]);

  const config = useMemo<WheelConfig>(() => {
    if (category === 'exercise') return EXERCISE;
    if (category === 'weekends') return WEEKENDS;
    if (meal === 'custom') {
      return {
        id: 'custom',
        title: 'Your custom wheel',
        subtitle: 'Add anything you want to choose between',
        choices: customOptions,
        color: '#F6C65B',
      };
    }
    return MEALS[meal];
  }, [category, customOptions, meal]);

  const selectCategory = (next: Category) => {
    setCategory(next);
    setResult(null);
    setSpinning(false);
  };

  const selectMeal = (next: MealKey) => {
    setMeal(next);
    setResult(null);
    setSpinning(false);
  };

  const startSpin = (winner: number) => {
    setSpinning(true);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setTimeout(() => {
      const picked = config.choices[winner];
      setResult(picked ?? null);
      setLastResult({ label: config.title, value: picked ?? '' });
      setSpinning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }, 3650);
  };

  const addOption = () => {
    const cleaned = newOption.trim();
    if (!cleaned || customOptions.includes(cleaned) || customOptions.length >= 12) return;
    setCustomOptions((current) => [...current, cleaned]);
    setNewOption('');
    Keyboard.dismiss();
  };

  const removeOption = (option: string) => {
    setCustomOptions((current) => current.filter((item) => item !== option));
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const emptyCustom = category === 'meals' && meal === 'custom' && config.choices.length === 0;
  const menuItems: Array<{ id: MenuSection; label: string; icon: keyof typeof Feather.glyphMap }> = [
    { id: 'overview', label: 'About the app', icon: 'info' },
    { id: 'privacy', label: 'Privacy & data', icon: 'shield' },
    { id: 'terms', label: 'Terms of use', icon: 'file-text' },
    { id: 'support', label: 'Support & contact', icon: 'help-circle' },
    { id: 'playStore', label: 'Google Play checklist', icon: 'check-circle' },
  ];
  const activeMenuTitle = menuItems.find((item) => item.id === menuSection)?.label ?? 'App menu';
  const openMenuSection = (section: MenuSection) => {
    setMenuSection(section);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topInset + 14, paddingBottom: bottomInset + 34 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pagePadding}>
          <View style={styles.headerRow}>
            <View>
              <View style={styles.brandLine}>
                <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.brand, { color: colors.primary }]}>WHEEL SPINNER</Text>
              </View>
              <Text style={styles.heading}>What’s the plan?</Text>
              <Text style={styles.subheading}>Take the decision out of your hands.</Text>
            </View>
            <Pressable
              testID="app-menu-button"
              accessibilityLabel="Open app menu"
              onPress={() => {
                setMenuSection('overview');
                setMenuOpen(true);
              }}
              style={({ pressed }) => [styles.headerBadge, { backgroundColor: colors.surfaceRaised }, pressed && styles.pressed]}
            >
              <Feather name="menu" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.categoryRow}>
            <CategoryTab label="Meals" icon="coffee" active={category === 'meals'} onPress={() => selectCategory('meals')} />
            <CategoryTab label="Exercise" icon="activity" active={category === 'exercise'} onPress={() => selectCategory('exercise')} />
            <CategoryTab label="Weekends" icon="sun" active={category === 'weekends'} onPress={() => selectCategory('weekends')} />
          </View>

          {category === 'meals' && (
            <View style={styles.mealSelector}>
              {(['breakfast', 'lunch', 'dinner', 'custom'] as MealKey[]).map((key) => (
                <Pressable
                  key={key}
                  testID={`meal-${key}`}
                  onPress={() => selectMeal(key)}
                  style={({ pressed }) => [
                    styles.mealChip,
                    { backgroundColor: meal === key ? colors.secondary : 'transparent' },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.mealChipText, { color: meal === key ? colors.primary : colors.mutedForeground }]}>
                    {key[0].toUpperCase() + key.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{config.title}</Text>
              <Text style={styles.sectionSubtitle}>{config.subtitle}</Text>
            </View>
            <View style={[styles.choiceCount, { backgroundColor: colors.surfaceRaised }]}>
              <Text style={styles.choiceCountText}>{config.choices.length}</Text>
              <Text style={styles.choiceCountLabel}>choices</Text>
            </View>
          </View>

          <View style={[styles.wheelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {emptyCustom ? (
              <View style={styles.emptyCustom}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="plus" size={24} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Make your own wheel</Text>
                <Text style={styles.emptyText}>Add a few options below and let the wheel choose for you.</Text>
              </View>
            ) : (
              <Wheel choices={config.choices} spinning={spinning} onSpin={startSpin} result={result} />
            )}
          </View>

          {category === 'meals' && meal === 'custom' && (
            <View style={[styles.customPanel, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
              <View style={styles.customHeadingRow}>
                <View>
                  <Text style={styles.customTitle}>Your options</Text>
                  <Text style={styles.customSubtitle}>Up to 12 choices</Text>
                </View>
                <Feather name="edit-3" size={17} color={colors.mutedForeground} />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  testID="custom-option-input"
                  value={newOption}
                  onChangeText={setNewOption}
                  onSubmitEditing={addOption}
                  placeholder="Add an option…"
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType="done"
                  style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
                />
                <Pressable
                  testID="add-option"
                  accessibilityLabel="Add custom option"
                  onPress={addOption}
                  style={({ pressed }) => [styles.addButton, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}
                >
                  <Feather name="plus" size={21} color={colors.primaryForeground} />
                </Pressable>
              </View>
              {customOptions.length > 0 && (
                <FlatList
                  data={customOptions}
                  scrollEnabled={false}
                  keyExtractor={(item) => item}
                  contentContainerStyle={styles.optionList}
                  renderItem={({ item }) => (
                    <View style={[styles.optionRow, { backgroundColor: colors.card }]}>
                      <View style={[styles.optionDot, { backgroundColor: WHEEL_COLORS[customOptions.indexOf(item) % WHEEL_COLORS.length] }]} />
                      <Text style={styles.optionText}>{item}</Text>
                      <Pressable onPress={() => removeOption(item)} hitSlop={10} accessibilityLabel={`Remove ${item}`}>
                        <Feather name="x" size={16} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  )}
                />
              )}
            </View>
          )}

          <View style={styles.bottomRow}>
            <View style={styles.resultSummary}>
              <Text style={styles.resultSummaryLabel}>LATEST PICK</Text>
              <Text style={[styles.resultSummaryValue, { color: lastResult ? colors.foreground : colors.mutedForeground }]}>
                {lastResult?.value ?? 'Nothing yet'}
              </Text>
            </View>
            <ShareButton result={lastResult?.value ?? null} />
          </View>
        </View>
      </ScrollView>
      <View
        testID="admob-banner-slot"
        accessibilityLabel="AdMob banner placement"
        style={[
          styles.adBannerContainer,
          { backgroundColor: colors.surfaceSoft, borderTopColor: colors.border, paddingBottom: bottomInset },
        ]}
      >
        <View style={[styles.adBannerSlot, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
          <Feather name="minus" size={14} color={colors.mutedForeground} />
          <Text style={[styles.adBannerLabel, { color: colors.mutedForeground }]}>Ad banner space</Text>
          <Feather name="minus" size={14} color={colors.mutedForeground} />
        </View>
      </View>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View
            style={[
              styles.menuPanel,
              { backgroundColor: colors.card, borderColor: colors.border, marginTop: topInset + 54 },
            ]}
          >
            <View style={styles.menuHeader}>
              {menuSection !== 'overview' ? (
                <Pressable
                  testID="menu-back"
                  accessibilityLabel="Back to app menu"
                  onPress={() => setMenuSection('overview')}
                  hitSlop={10}
                  style={styles.menuBack}
                >
                  <Feather name="arrow-left" size={19} color={colors.foreground} />
                </Pressable>
              ) : (
                <View style={styles.menuBack} />
              )}
              <Text style={styles.menuTitle}>{activeMenuTitle}</Text>
              <Pressable
                testID="close-app-menu"
                accessibilityLabel="Close app menu"
                onPress={() => setMenuOpen(false)}
                hitSlop={10}
                style={styles.menuBack}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {menuSection === 'overview' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuList}>
                <View style={[styles.menuIntro, { backgroundColor: colors.surfaceSoft }]}>
                  <View style={[styles.menuIntroIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="compass" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.menuIntroCopy}>
                    <Text style={styles.menuIntroTitle}>Wheel Spinner</Text>
                    <Text style={styles.menuIntroText}>A simple decision wheel for meals, movement, and weekends.</Text>
                  </View>
                </View>
                {menuItems.slice(1).map((item) => (
                  <Pressable
                    key={item.id}
                    testID={`menu-${item.id}`}
                    onPress={() => openMenuSection(item.id)}
                    style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.border }, pressed && styles.pressed]}
                  >
                    <View style={[styles.menuItemIcon, { backgroundColor: colors.surfaceRaised }]}>
                      <Feather name={item.icon} size={17} color={colors.primary} />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContent}>
                {menuSection === 'privacy' && (
                  <>
                    <Text style={styles.menuLead}>Wheel Spinner is designed to work without an account.</Text>
                    <View style={styles.infoBlock}>
                      <InfoRow icon="hard-drive" title="Stored on this device" text="Your custom wheel choices are saved locally on your device." />
                      <InfoRow icon="user-x" title="No account required" text="The app does not ask for a name, email address, profile, or login." />
                      <InfoRow icon="share-2" title="Sharing is user-controlled" text="A result only leaves the app when you choose to share it through your device share sheet." />
                      <InfoRow icon="image" title="Ads disclosure" text="This build reserves space for a future banner. No live ad SDK is connected yet." />
                    </View>
                    <Text style={styles.menuNote}>Before publishing, add a hosted privacy policy URL to the Google Play listing and complete the Data safety form.</Text>
                  </>
                )}
                {menuSection === 'terms' && (
                  <>
                    <Text style={styles.menuLead}>Wheel Spinner is a casual decision-making tool for everyday choices.</Text>
                    <View style={styles.infoBlock}>
                      <InfoRow icon="check" title="Use of the app" text="Use the wheels for personal meal, exercise, and weekend planning." />
                      <InfoRow icon="edit-3" title="Your custom choices" text="You are responsible for the custom options you enter into the app." />
                      <InfoRow icon="heart" title="Exercise reminder" text="Choose activities that are appropriate for your health and fitness level." />
                    </View>
                    <Text style={styles.menuNote}>Have a legal professional review and replace this summary with your final terms before publishing.</Text>
                  </>
                )}
                {menuSection === 'support' && (
                  <>
                    <Text style={styles.menuLead}>Make it easy for users and Google Play reviewers to reach the developer.</Text>
                    <View style={styles.infoBlock}>
                      <InfoRow icon="mail" title="Support email" text="Add your developer support email here before submitting the store listing." />
                      <InfoRow icon="globe" title="Website" text="Add an optional developer or product website to your Play Store listing." />
                      <InfoRow icon="trash-2" title="Data deletion" text="Custom choices can be removed from the Custom wheel inside the app." />
                    </View>
                    <View style={[styles.actionNotice, { backgroundColor: colors.secondary }]}>
                      <Feather name="alert-circle" size={17} color={colors.primary} />
                      <Text style={styles.actionNoticeText}>Developer action needed: add a real support contact before publishing.</Text>
                    </View>
                  </>
                )}
                {menuSection === 'playStore' && (
                  <>
                    <Text style={styles.menuLead}>A quick in-app checklist for the information Google Play typically requests.</Text>
                    <View style={styles.checklist}>
                      {[
                        { label: 'App icon', status: 'Ready' },
                        { label: 'Privacy policy URL', status: 'Add URL' },
                        { label: 'Data safety form', status: 'Complete in Play Console' },
                        { label: 'Content rating', status: 'Complete questionnaire' },
                        { label: 'Target audience', status: 'Declare audience' },
                        { label: 'Ads declaration', status: 'Declare if AdMob is enabled' },
                        { label: 'Screenshots & store copy', status: 'Add listing assets' },
                        { label: 'Support email', status: 'Required from developer' },
                      ].map((item) => (
                        <View key={item.label} style={[styles.checklistRow, { borderBottomColor: colors.border }]}>
                          <Feather
                            name={item.status === 'Ready' ? 'check-circle' : 'circle'}
                            size={17}
                            color={item.status === 'Ready' ? colors.primary : colors.mutedForeground}
                          />
                          <Text style={styles.checklistLabel}>{item.label}</Text>
                          <Text style={[styles.checklistStatus, { color: item.status === 'Ready' ? colors.primary : colors.mutedForeground }]}>
                            {item.status}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.menuNote}>This checklist helps organize the submission; Google Play approval is determined in Play Console and cannot be guaranteed by an in-app menu.</Text>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  text: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceRaised }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pagePadding: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  brandDot: { width: 8, height: 8, borderRadius: 4 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.3 },
  heading: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  subheading: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 5 },
  headerBadge: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryTab: { flex: 1, minHeight: 45, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  categoryTabText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  mealSelector: { flexDirection: 'row', backgroundColor: '#0D1D31', borderRadius: 14, padding: 4, marginBottom: 22 },
  mealChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  mealChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.3 },
  sectionSubtitle: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
  choiceCount: { minWidth: 52, paddingVertical: 8, paddingHorizontal: 9, borderRadius: 12, alignItems: 'center' },
  choiceCountText: { color: '#F6C65B', fontFamily: 'Inter_700Bold', fontSize: 15 },
  choiceCountLabel: { color: '#8FA4B8', fontFamily: 'Inter_500Medium', fontSize: 9, marginTop: 1 },
  wheelCard: { borderRadius: 24, borderWidth: 1, paddingTop: 20, paddingBottom: 22, alignItems: 'center', overflow: 'hidden' },
  wheelStage: { alignItems: 'center', width: '100%' },
  wheelPressable: { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2, overflow: 'visible' },
  pointer: { position: 'absolute', zIndex: 3, top: 3, width: 0, height: 0, borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 25, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  pointerShadow: { position: 'absolute', zIndex: 2, top: 6, width: 0, height: 0, borderLeftWidth: 16, borderRightWidth: 16, borderBottomWidth: 29, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(0,0,0,0.3)' },
  spinButton: { marginTop: 18, minWidth: 166, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  spinButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  resultPill: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, minWidth: 160 },
  resultEyebrow: { color: '#8FA4B8', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1 },
  resultText: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 3, textAlign: 'center' },
  spinHint: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 18 },
  emptyCustom: { minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 38 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 18 },
  emptyText: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 7 },
  customPanel: { borderRadius: 20, borderWidth: 1, padding: 15, marginTop: 14 },
  customHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customTitle: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 15 },
  customSubtitle: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 9 },
  input: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 13 },
  addButton: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  optionList: { gap: 7, marginTop: 12 },
  optionRow: { minHeight: 38, borderRadius: 11, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionDot: { width: 7, height: 7, borderRadius: 4 },
  optionText: { flex: 1, color: '#F7F8FA', fontFamily: 'Inter_500Medium', fontSize: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 },
  resultSummary: { flex: 1 },
  resultSummaryLabel: { color: '#8FA4B8', fontFamily: 'Inter_700Bold', letterSpacing: 1, fontSize: 9 },
  resultSummaryValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 4 },
  shareButton: { borderWidth: 1, minHeight: 40, paddingHorizontal: 14, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  shareButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  adBannerContainer: { minHeight: 60, paddingHorizontal: 14, paddingTop: 6, borderTopWidth: 1 },
  adBannerSlot: { height: 50, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  adBannerLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.4 },
  menuBackdrop: { flex: 1, paddingHorizontal: 16 },
  menuPanel: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', maxHeight: '82%' },
  menuHeader: { minHeight: 58, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuBack: { width: 24, alignItems: 'flex-start', justifyContent: 'center' },
  menuTitle: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 16 },
  menuList: { paddingHorizontal: 15, paddingBottom: 14 },
  menuIntro: { padding: 14, borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 8 },
  menuIntroIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuIntroCopy: { flex: 1 },
  menuIntroTitle: { color: '#F7F8FA', fontFamily: 'Inter_700Bold', fontSize: 15 },
  menuIntroText: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  menuItem: { minHeight: 59, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuItemLabel: { flex: 1, color: '#F7F8FA', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  menuContent: { paddingHorizontal: 17, paddingBottom: 18 },
  menuLead: { color: '#F7F8FA', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 21, marginBottom: 13 },
  infoBlock: { borderRadius: 16, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', gap: 11, paddingVertical: 13, borderBottomWidth: 1 },
  infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoTitle: { color: '#F7F8FA', fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  infoText: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 3 },
  menuNote: { color: '#8FA4B8', fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 16 },
  actionNotice: { marginTop: 17, borderRadius: 13, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  actionNoticeText: { flex: 1, color: '#F7F8FA', fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  checklist: { borderRadius: 16, overflow: 'hidden' },
  checklistRow: { minHeight: 48, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  checklistLabel: { flex: 1, color: '#F7F8FA', fontFamily: 'Inter_500Medium', fontSize: 12 },
  checklistStatus: { maxWidth: 118, textAlign: 'right', fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  pressed: { opacity: 0.78 },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});