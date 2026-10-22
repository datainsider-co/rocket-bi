import { Layout } from 'antd';
import { Outlet, useLocation, useParams } from 'react-router';
import { createParentId, parseIdParam, sectionFromPath } from '../directory.utils';
import { NameModal } from '../dialogs/NameModal';
import { DirectorySidebar } from './DirectorySidebar';
import { useCreateItem } from './useCreateItem';

const CREATE_COPY = {
  folder: { title: 'Create Folder', label: 'Folder name', placeholder: 'Type folder name', okText: 'Create' },
  dashboard: { title: 'Create Dashboard', label: 'Dashboard name', placeholder: 'Type dashboard name', okText: 'Create' }
};

/** Shell of the directory pages (v1 `DirectoryListing.vue`): sidebar with `New`, and the listing. */
export function DirectoryLayout() {
  const { pathname } = useLocation();
  const { name } = useParams();
  const section = sectionFromPath(pathname);
  const create = useCreateItem(createParentId(section, parseIdParam(name)));

  return (
    <Layout className="!bg-transparent">
      <DirectorySidebar active={section} onCreate={create.open} />
      <Layout.Content className="min-w-0">
        <Outlet />
      </Layout.Content>
      <NameModal
        open={create.kind !== null}
        copy={CREATE_COPY[create.kind ?? 'folder']}
        isSubmitting={create.isSubmitting}
        error={create.error}
        onSubmit={value => void create.submit(value)}
        onCancel={create.close}
      />
    </Layout>
  );
}
