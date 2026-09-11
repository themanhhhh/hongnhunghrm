"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  KeyRound,
  Network,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

type AccountForm = {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone: string;
  role_id: string;
  department_id: string;
  employee_id: string;
};

const emptyAccount: AccountForm = {
  username: "",
  password: "123456",
  full_name: "",
  email: "",
  phone: "",
  role_id: "role-employee",
  department_id: "",
  employee_id: "",
};

const fallbackRoles = [
  { role_id: "role-admin", role_name: "Administrator" },
  { role_id: "role-hr", role_name: "HR Staff" },
  { role_id: "role-ceo", role_name: "Ban Giám Đốc" },
  { role_id: "role-khoi", role_name: "Trưởng Khối" },
  { role_id: "role-manager", role_name: "Trưởng Phòng" },
  { role_id: "role-employee", role_name: "Nhân viên" },
];

const cards = [
  {
    title: "Tài khoản & phân quyền",
    desc: "Vai trò, trạng thái và phạm vi truy cập",
    icon: KeyRound,
    count: "24 tài khoản",
    tone: "violet" as const,
  },
  {
    title: "Sơ đồ tổ chức",
    desc: "Bộ phận, cấp trên và người phụ trách",
    icon: Network,
    count: "14 bộ phận",
    tone: "teal" as const,
  },
  {
    title: "Vị trí công việc",
    desc: "Định biên, thang bậc và lộ trình HĐLĐ",
    icon: UsersRound,
    count: "38 vị trí",
    tone: "blue" as const,
  },
  {
    title: "Loại hợp đồng",
    desc: "Thời hạn, thử việc và điều kiện áp dụng",
    icon: ShieldCheck,
    count: "6 loại HĐLĐ",
    tone: "amber" as const,
  },
];

type CatalogKind = "departments" | "positions";
type CatalogForm = Record<string, string | number>;

export default function AdminPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";
  const queryClient = useQueryClient();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [form, setForm] = useState<AccountForm>(emptyAccount);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>({});
  const [catalogError, setCatalogError] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: api.admin,
  });
  const createAccountMutation = useMutation({
    mutationFn: () =>
      api.write("/admin/users", "POST", form, {
        resource: "admin",
        action: "create",
      }),
    onSuccess: () => {
      setShowAccountForm(false);
      setForm(emptyAccount);
      setFormError("");
      setSuccessMessage("Tạo tài khoản thành công.");
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    },
  });
  const catalogMutation = useMutation({
    mutationFn: ({
      kind,
      id,
      payload,
    }: {
      kind: CatalogKind;
      id: string | null;
      payload: CatalogForm;
    }) =>
      api.write(
        `/admin/${kind}${id ? `/${id}` : ""}`,
        id ? "PUT" : "POST",
        payload,
        { resource: "admin", action: id ? "edit" : "create" },
      ),
    onSuccess: () => {
      setShowCatalogForm(false);
      setEditingCatalogId(null);
      setCatalogError("");
      setSuccessMessage("Lưu danh mục thành công.");
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    },
  });
  const deleteCatalogMutation = useMutation({
    mutationFn: async ({ kind, id }: { kind: CatalogKind; id: string }) => {
      const result = (await api.remove(`/admin/${kind}/${id}`, {
        resource: "admin",
        action: "delete",
      })) as { success?: boolean; message?: string };
      if (result && result.success === false)
        throw new ApiError(result.message ?? "Không thể xóa danh mục.", 400);
      return result;
    },
    onSuccess: () => {
      setSuccessMessage("Đã xóa danh mục.");
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
    },
  });
  const roles = data?.rolesList?.length ? data.rolesList : fallbackRoles;
  const departments = data?.departmentsList ?? [];
  const employees = data?.employeesList ?? [];
  const catalogKind: CatalogKind | null =
    activeTab === "departments" || activeTab === "positions" ? activeTab : null;
  const catalogRows =
    catalogKind === "departments"
      ? departments
      : catalogKind === "positions"
        ? (data?.positionsList ?? [])
        : [];
  const liveCards = cards.map((card) => ({
    ...card,
    count: card.title.includes("Tài khoản")
      ? `${data?.users ?? 24} tài khoản`
      : card.title.includes("Sơ đồ")
        ? `${data?.departments ?? 14} bộ phận`
        : card.title.includes("Vị trí")
          ? `${data?.positions ?? 38} vị trí`
          : `${data?.contractTypes ?? 6} loại HĐLĐ`,
  }));
  const userRows = data?.userRows ?? [];
  const updateField = (name: keyof AccountForm, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  const submitAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!form.username.trim() || !form.full_name.trim()) {
      setFormError("Vui lòng nhập tên đăng nhập và họ tên.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    createAccountMutation.mutate();
  };
  const openCatalogForm = (
    kind: CatalogKind,
    row?: Record<string, unknown>,
  ) => {
    setCatalogError("");
    setEditingCatalogId(
      row
        ? String(
            row[kind === "departments" ? "department_id" : "position_id"] ?? "",
          )
        : null,
    );
    if (kind === "departments") {
      setCatalogForm({
        department_code: String(row?.department_code ?? ""),
        department_name: String(row?.department_name ?? ""),
        parent_department_id: String(row?.parent_department_id ?? ""),
        manager_id: String(row?.manager_id ?? ""),
        target_headcount: String(row?.target_headcount ?? "0"),
        description: String(row?.description ?? ""),
      });
    } else {
      setCatalogForm({
        position_code: String(row?.position_code ?? ""),
        position_name: String(row?.position_name ?? ""),
        department_id: String(
          row?.department_id ?? departments[0]?.department_id ?? "",
        ),
        target_headcount: String(row?.target_headcount ?? "0"),
        is_assistant: String(Number(row?.is_assistant ?? 0)),
        salary_grade: String(row?.salary_grade ?? ""),
        description: String(row?.description ?? ""),
      });
    }
    setShowCatalogForm(true);
  };
  const updateCatalogField = (name: string, value: string) =>
    setCatalogForm((current) => ({ ...current, [name]: value }));
  const submitCatalog = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!catalogKind) return;
    const code = String(
      catalogForm[
        catalogKind === "departments" ? "department_code" : "position_code"
      ] ?? "",
    ).trim();
    const name = String(
      catalogForm[
        catalogKind === "departments" ? "department_name" : "position_name"
      ] ?? "",
    ).trim();
    if (!code || !name) {
      setCatalogError("Vui lòng nhập đầy đủ mã và tên danh mục.");
      return;
    }
    if (
      catalogKind === "positions" &&
      !String(catalogForm.department_id ?? "").trim()
    ) {
      setCatalogError("Vui lòng chọn bộ phận trực thuộc.");
      return;
    }
    catalogMutation.mutate({
      kind: catalogKind,
      id: editingCatalogId,
      payload: {
        ...catalogForm,
        target_headcount: Number(catalogForm.target_headcount) || 0,
        ...(catalogKind === "positions"
          ? { is_assistant: Number(catalogForm.is_assistant) || 0 }
          : {}),
      },
    });
  };
  const removeCatalog = (kind: CatalogKind, row: Record<string, unknown>) => {
    const id = String(
      row[kind === "departments" ? "department_id" : "position_id"] ?? "",
    );
    const label = String(
      row[kind === "departments" ? "department_name" : "position_name"] ??
        "danh mục này",
    );
    if (!id || !window.confirm(`Bạn có chắc chắn muốn xóa "${label}"?`)) return;
    deleteCatalogMutation.mutate({ kind, id });
  };
  const catalogTitle =
    catalogKind === "departments"
      ? "Danh mục Bộ phận"
      : "Danh mục Vị trí công việc";
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
            SYSTEM GOVERNANCE
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            {catalogKind ? catalogTitle : "Quản trị hệ thống"}
          </h1>
        </div>
        {catalogKind ? (
          <Button onClick={() => openCatalogForm(catalogKind)}>
            <Plus size={16} /> Thêm danh mục
          </Button>
        ) : (
          <Button
            onClick={() => {
              setShowAccountForm(true);
              setFormError("");
              setSuccessMessage("");
            }}
          >
            <Plus size={16} /> Tạo tài khoản
          </Button>
        )}
      </section>
      {successMessage && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {successMessage}
        </div>
      )}
      {catalogKind ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{catalogTitle}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Danh mục dùng chung cho tuyển dụng, nhân sự và báo cáo.
              </p>
            </div>
            <Badge tone="teal">{catalogRows.length} bản ghi</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  {catalogKind === "departments" ? (
                    <tr>
                      <th className="px-4 py-3">Mã bộ phận</th>
                      <th className="px-4 py-3">Tên bộ phận</th>
                      <th className="px-4 py-3">Bộ phận cấp trên</th>
                      <th className="px-4 py-3">Trưởng bộ phận</th>
                      <th className="px-4 py-3">Định biên</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3">Mã vị trí</th>
                      <th className="px-4 py-3">Tên vị trí</th>
                      <th className="px-4 py-3">Bộ phận</th>
                      <th className="px-4 py-3">Chỉ tiêu</th>
                      <th className="px-4 py-3">Bậc lương</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogRows.map((row) => (
                    <tr
                      key={String(
                        row[
                          catalogKind === "departments"
                            ? "department_id"
                            : "position_id"
                        ],
                      )}
                    >
                      {catalogKind === "departments" ? (
                        <>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-700">
                            {String(row.department_code ?? "-")}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {String(row.department_name ?? "-")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(row.parent_department_name ?? "-")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(row.manager_name ?? "-")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(row.target_headcount ?? 0)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-700">
                            {String(row.position_code ?? "-")}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {String(row.position_name ?? "-")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(
                              row.department_name ?? row.department_id ?? "-",
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(row.target_headcount ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(row.salary_grade ?? "-")}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCatalogForm(catalogKind, row)}
                            aria-label="Sửa"
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCatalog(catalogKind, row)}
                            aria-label="Xóa"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!catalogRows.length && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-slate-400"
                      >
                        Chưa có dữ liệu danh mục.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {deleteCatalogMutation.error instanceof ApiError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {deleteCatalogMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {liveCards.map(({ title, desc, icon: Icon, count, tone }) => (
              <Card
                key={title}
                className="group cursor-pointer transition hover:-translate-y-0.5 hover:border-teal-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700">
                      <Icon size={20} />
                    </div>
                    <Badge tone={tone}>{count}</Badge>
                  </div>
                  <CardTitle className="mt-5">{title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{desc}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs font-bold text-teal-700">
                    Mở danh mục <span>→</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Danh sách tài khoản</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Tài khoản truy cập và vai trò hiện tại trong hệ thống.
                </p>
              </div>
              <Badge tone="violet">
                {userRows.length || data?.users || 0} tài khoản
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Tài khoản</th>
                      <th className="px-4 py-3">Họ và tên</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Đơn vị</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userRows.map((user) => (
                      <tr key={String(user.user_id)}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-700">
                          {String(user.username ?? "-")}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {String(user.full_name ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(user.role_name ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(user.department_name ?? "Toàn hệ thống")}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={Number(user.status) === 1 ? "teal" : "rose"}
                          >
                            {Number(user.status) === 1
                              ? "Đang hoạt động"
                              : "Đã khóa"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!userRows.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-slate-400"
                        >
                          Chưa có dữ liệu tài khoản.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động hệ thống gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                "Cập nhật định biên Phòng Cloud và Hạ tầng",
                "Tạo tài khoản cho Lê Minh Quân",
                "Thêm bước lộ trình HĐLĐ cho vị trí Chuyên viên ERP",
                "Khóa tài khoản không hoạt động",
              ].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-7 place-items-center rounded-full bg-teal-50 text-teal-700">
                      <Building2 size={14} />
                    </div>
                    <span className="font-medium text-slate-700">{item}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {i + 1} giờ trước
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
      {showCatalogForm && catalogKind && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCatalogForm(false);
          }}
        >
          <Card className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>
                  {editingCatalogId ? "Cập nhật" : "Thêm"}{" "}
                  {catalogTitle.toLowerCase()}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Danh mục này được dùng chung trong toàn hệ thống.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCatalogForm(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={submitCatalog}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Mã *
                  </label>
                  <Input
                    value={String(
                      catalogForm[
                        catalogKind === "departments"
                          ? "department_code"
                          : "position_code"
                      ] ?? "",
                    )}
                    onChange={(event) =>
                      updateCatalogField(
                        catalogKind === "departments"
                          ? "department_code"
                          : "position_code",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Tên *
                  </label>
                  <Input
                    value={String(
                      catalogForm[
                        catalogKind === "departments"
                          ? "department_name"
                          : "position_name"
                      ] ?? "",
                    )}
                    onChange={(event) =>
                      updateCatalogField(
                        catalogKind === "departments"
                          ? "department_name"
                          : "position_name",
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
                {catalogKind === "departments" ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Mã bộ phận cấp trên
                      </label>
                      <Input
                        value={String(catalogForm.parent_department_id ?? "")}
                        onChange={(event) =>
                          updateCatalogField(
                            "parent_department_id",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Mã trưởng bộ phận
                      </label>
                      <Input
                        value={String(catalogForm.manager_id ?? "")}
                        onChange={(event) =>
                          updateCatalogField("manager_id", event.target.value)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Bộ phận trực thuộc *
                      </label>
                      <select
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                        value={String(catalogForm.department_id ?? "")}
                        onChange={(event) =>
                          updateCatalogField(
                            "department_id",
                            event.target.value,
                          )
                        }
                        required
                      >
                        <option value="">-- Chọn bộ phận --</option>
                        {departments.map((department) => (
                          <option
                            key={String(department.department_id)}
                            value={String(department.department_id)}
                          >
                            {String(
                              department.department_name ??
                                department.department_id,
                            )}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Bậc lương
                      </label>
                      <Input
                        value={String(catalogForm.salary_grade ?? "")}
                        onChange={(event) =>
                          updateCatalogField("salary_grade", event.target.value)
                        }
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    {catalogKind === "departments" ? "Định biên" : "Chỉ tiêu"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={String(catalogForm.target_headcount ?? "0")}
                    onChange={(event) =>
                      updateCatalogField("target_headcount", event.target.value)
                    }
                  />
                </div>
                {catalogKind === "positions" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Loại vị trí
                    </label>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      value={String(catalogForm.is_assistant ?? "0")}
                      onChange={(event) =>
                        updateCatalogField("is_assistant", event.target.value)
                      }
                    >
                      <option value="0">Vị trí chính</option>
                      <option value="1">Trợ lý</option>
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Mô tả
                  </label>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                    value={String(catalogForm.description ?? "")}
                    onChange={(event) =>
                      updateCatalogField("description", event.target.value)
                    }
                  />
                </div>
                {catalogError && (
                  <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {catalogError}
                  </div>
                )}
                {catalogMutation.error instanceof ApiError && (
                  <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {catalogMutation.error.message}
                  </div>
                )}
                <div className="flex justify-end gap-2 md:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCatalogForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={catalogMutation.isPending}>
                    {catalogMutation.isPending ? "Đang lưu..." : "Lưu danh mục"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {showAccountForm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAccountForm(false);
          }}
        >
          <Card className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Thêm tài khoản mới</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Tạo thông tin đăng nhập và gán phạm vi truy cập.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAccountForm(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={submitAccount}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Tên đăng nhập *
                  </label>
                  <Input
                    value={form.username}
                    onChange={(event) =>
                      updateField("username", event.target.value)
                    }
                    placeholder="vd: nguyen.van.a"
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Mật khẩu *
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Họ và tên *
                  </label>
                  <Input
                    value={form.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="name@bravo.com.vn"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Số điện thoại
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="0900000000"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Vai trò *
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    value={form.role_id}
                    onChange={(event) =>
                      updateField("role_id", event.target.value)
                    }
                    required
                  >
                    {roles.map((role) => (
                      <option
                        key={String(role.role_id)}
                        value={String(role.role_id)}
                      >
                        {String(role.role_name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Phòng ban
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    value={form.department_id}
                    onChange={(event) =>
                      updateField("department_id", event.target.value)
                    }
                  >
                    <option value="">-- Không gán phòng ban --</option>
                    {departments.map((department) => (
                      <option
                        key={String(department.department_id)}
                        value={String(department.department_id)}
                      >
                        {String(
                          department.department_name ??
                            department.department_id,
                        )}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Liên kết hồ sơ nhân viên
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                    value={form.employee_id}
                    onChange={(event) =>
                      updateField("employee_id", event.target.value)
                    }
                  >
                    <option value="">-- Không liên kết hồ sơ --</option>
                    {employees.map((employee) => (
                      <option
                        key={String(employee.employee_id)}
                        value={String(employee.employee_id)}
                      >
                        {String(employee.employee_code ?? employee.employee_id)}{" "}
                        - {String(employee.full_name ?? "")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Nên liên kết hồ sơ để nhân viên xem được dashboard và dữ
                    liệu cá nhân.
                  </p>
                </div>
                {formError && (
                  <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {formError}
                  </div>
                )}
                {createAccountMutation.error && (
                  <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {createAccountMutation.error instanceof ApiError
                      ? createAccountMutation.error.message
                      : "Không thể tạo tài khoản."}
                  </div>
                )}
                <div className="flex justify-end gap-2 md:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAccountForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending
                      ? "Đang tạo..."
                      : "Tạo tài khoản"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
