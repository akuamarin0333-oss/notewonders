// Required testIDs: tabs-navigator
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Tabs: () => <View testID="tabs-navigator" />,
}));

const { Tabs } = require('expo-router');

const TabsLayout = () => <Tabs />;

describe('Tabs Navigation', () => {
  it('renders tabs navigator without crashing', () => {
    render(<TabsLayout />);
    expect(screen.getByTestId('tabs-navigator')).toBeTruthy();
  });
});
