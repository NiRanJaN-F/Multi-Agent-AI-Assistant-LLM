import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import TodoList from '../components/TodoList';
import { tasks } from '../api/controllers/tasks'; // Assuming tasks is a mock data

describe('TodoList', () => {
  it('renders a list of tasks', async () => {
    const { getByText, getByPlaceholderText } = render(<TodoList tasks={tasks} />);
    expect(getByText('Task 1')).toBeInTheDocument();
    expect(getByText('Task 2')).toBeInTheDocument();
    expect(getByText('Task 3')).toBeInTheDocument();
  });

  it('adds a new task', async () => {
    const { getByPlaceholderText, getByText } = render(<TodoList tasks={tasks} />);
    const input = getByPlaceholderText('Add a new task');
    fireEvent.change(input, { target: { value: 'New Task' } });
    fireEvent.click(getByText('Add'));

    await waitFor(() => {
      expect(getByText('New Task')).toBeInTheDocument();
    });
  });

  it('completes a task', async () => {
    const { getByText, getByTestId } = render(<TodoList tasks={tasks} />);
    const taskItem = getByTestId('task-item-0');
    fireEvent.click(getByTestId('complete-button-0'));

    await waitFor(() => {
      expect(taskItem).toHaveClass('completed');
    });
  });

  it('deletes a task', async () => {
    const { getByText, getByTestId } = render(<TodoList tasks={tasks} />);
    const taskItem = getByTestId('task-item-0');
    fireEvent.click(getByTestId('delete-button-0'));

    await waitFor(() => {
      expect(taskItem).not.toBeInTheDocument();
    });
  });
});