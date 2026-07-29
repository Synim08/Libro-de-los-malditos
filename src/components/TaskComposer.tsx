import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors, serifFont } from '../theme';

const parchmentTexture = require('../../assets/parchment-card.png');

type TaskComposerProps = {
  defaultCursed?: boolean;
  onAdd: (title: string, cursed: boolean) => void;
};

export function TaskComposer({
  defaultCursed = false,
  onAdd,
}: TaskComposerProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const title = value.trim();

    if (!title) {
      return;
    }

    onAdd(title, defaultCursed);
    setValue('');
  };

  const isDisabled = !value.trim();

  return (
    <View style={styles.frame}>
      <ImageBackground
        imageStyle={styles.parchmentImage}
        resizeMode="cover"
        source={parchmentTexture}
        style={styles.parchment}
      >
        <TextInput
          accessibilityLabel={
            defaultCursed ? 'Nueva maldición' : 'Nuevo juramento'
          }
          maxLength={90}
          onChangeText={setValue}
          onSubmitEditing={submit}
          placeholder={
            defaultCursed
              ? 'Consignar una maldición'
              : 'Registrar un juramento'
          }
          placeholderTextColor="#66523E"
          returnKeyType="done"
          selectionColor={colors.crimson}
          style={[styles.input, defaultCursed && styles.inputCursed]}
          value={value}
        />
      </ImageBackground>

      <Pressable
        accessibilityLabel={
          defaultCursed ? 'Agregar maldición' : 'Agregar juramento'
        }
        accessibilityRole="button"
        disabled={isDisabled}
        onPress={submit}
        style={({ pressed }) => [
          styles.addButton,
          isDisabled && styles.addButtonDisabled,
          pressed && !isDisabled && styles.addButtonPressed,
        ]}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ['#2A211C', '#17110E']
              : ['#6A4A2D', '#2B1B12', '#120C09']
          }
          style={styles.addButtonFill}
        >
          <MaterialCommunityIcons
            color={isDisabled ? '#6D5D4A' : colors.ivory}
            name={defaultCursed ? 'sword-cross' : 'plus'}
            size={defaultCursed ? 25 : 31}
          />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  parchment: {
    flex: 1,
    minHeight: 68,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  parchmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  input: {
    minHeight: 66,
    paddingHorizontal: 18,
    color: '#2B2017',
    fontFamily: serifFont,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  inputCursed: {
    paddingHorizontal: 14,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  addButton: {
    width: 62,
    height: 62,
    overflow: 'hidden',
    padding: 2,
    borderRadius: 31,
    backgroundColor: colors.bronze,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 5,
  },
  addButtonFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  addButtonDisabled: {
    backgroundColor: '#554434',
    opacity: 0.75,
  },
  addButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
});
