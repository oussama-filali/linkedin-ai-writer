import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThreeIntro from '../../components/ThreeIntro';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ThreeIntro />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
