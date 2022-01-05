import {
  render,
  fireEvent,
  screen,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import DashboardEntry from './DashboardEntry';
import { Provider } from 'react-redux';
import { store } from '../../appStore/store';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { api } from '../../resources/assets';

const server = setupServer(
  rest.get(api + '/retrieveUser/', (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.json({
        errorMessage: `User not found`,
      }),
    );
  }),
);

let history = createMemoryHistory({ initialEntries: ['/login'] });
beforeEach(() => {
  history = createMemoryHistory({ initialEntries: ['/login'] });
  act(() => {
    render(
      <Provider store={store}>
        <Router location={history.location} navigator={history}>
          <DashboardEntry />
        </Router>
      </Provider>,
    );
  });
  server.listen();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());

test('SSO login and guest login exist', async () => {
  expect(screen.getByText('JHU SSO Login')).toBeInTheDocument();
  expect(screen.getByText('Continue as guest')).toBeInTheDocument();
});

test('SSO login has correct redirect', async () => {
  expect(screen.getByText('JHU SSO Login')).toHaveAttribute(
    'href',
    'https://ucredit-api.herokuapp.com/api/login',
  );
  expect(screen.getByText('Continue as guest')).toBeInTheDocument();
});

test('Guest login continues', async () => {
  server.use();

  await waitFor(() => {
    fireEvent.click(screen.getByText('Continue as guest'));
    expect(history.location.pathname).toBe('/dashboard');
  });
});
