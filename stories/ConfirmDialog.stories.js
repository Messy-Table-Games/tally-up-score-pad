import '../src/confirm-dialog.js';

export default {
  title: 'ConfirmDialog',
  component: 'confirm-dialog',
  parameters: {
    layout: 'centered',
  },
};

const Template = () => {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '16px';
  wrapper.style.alignItems = 'center';

  const buttonStyle = {
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '16px',
    padding: '8px 16px',
    fontSize: '1em',
    cursor: 'pointer',
    minWidth: '200px',
  };

  const status = document.createElement('div');
  status.style.fontSize = '0.95em';
  status.style.color = '#333';
  status.textContent = 'Last action: none';

  const currentLabels = {
    confirm: 'OK',
    cancel: 'Cancel',
  };

  const dialog = document.createElement('confirm-dialog');
  dialog.addEventListener('confirm-dialog-confirm', () => {
    status.textContent = `Last action: ${currentLabels.confirm}`;
  });
  dialog.addEventListener('confirm-dialog-cancel', () => {
    status.textContent = `Last action: ${currentLabels.cancel}`;
  });
  dialog.addEventListener('confirm-dialog-dismissed', () => {
    status.textContent = 'Last action: dismissed';
  });
  wrapper.appendChild(dialog);
  wrapper.appendChild(status);

  const withCancelBtn = document.createElement('button');
  withCancelBtn.textContent = 'Open (with cancel)';
  Object.assign(withCancelBtn.style, buttonStyle);
  withCancelBtn.addEventListener('click', () => {
    currentLabels.confirm = 'Reset';
    currentLabels.cancel = 'Keep scores';
    status.textContent = 'Last action: waiting for response';
    dialog.show({
      title: 'Reset scores?',
      message: 'This action clears all tracked scores.',
      confirmLabel: 'Reset',
      cancelLabel: 'Keep scores',
      variant: 'danger',
      showCancel: true,
    });
  });

  const withoutCancelBtn = document.createElement('button');
  withoutCancelBtn.textContent = 'Open (no cancel)';
  Object.assign(withoutCancelBtn.style, buttonStyle);
  withoutCancelBtn.addEventListener('click', () => {
    currentLabels.confirm = 'Got it';
    currentLabels.cancel = 'Cancel';
    status.textContent = 'Last action: waiting for response';
    dialog.show({
      title: 'Auto close notice',
      message: 'This dialog hides the cancel button.',
      confirmLabel: 'Got it',
      showCancel: false,
      variant: 'primary',
    });
  });

  wrapper.append(withCancelBtn, withoutCancelBtn);
  return wrapper;
};

export const Playground = Template.bind({});
