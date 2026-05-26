type RegistrationStatus = "DRAFT" | "SUBMITTED" | string;
type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | string | null | undefined;

export function getStudentRegistrationStatusLabel(status: RegistrationStatus, reviewStatus: ReviewStatus) {
  if (status !== "SUBMITTED") return "草稿";
  if (reviewStatus === "APPROVED") return "报名成功";
  if (reviewStatus === "REJECTED") return "审核不通过";
  return "待审核";
}

export function getAdminReviewStatusLabel(status: RegistrationStatus, reviewStatus: ReviewStatus) {
  if (status !== "SUBMITTED") return "草稿";
  if (reviewStatus === "APPROVED") return "审核通过";
  if (reviewStatus === "REJECTED") return "审核不通过";
  return "待审核";
}

export function getReviewStatusClass(status: RegistrationStatus, reviewStatus: ReviewStatus) {
  if (status !== "SUBMITTED") return "status-draft";
  if (reviewStatus === "APPROVED") return "status-approved";
  if (reviewStatus === "REJECTED") return "status-rejected";
  return "status-pending";
}

export function isReviewed(status: RegistrationStatus, reviewStatus: ReviewStatus) {
  return status === "SUBMITTED" && (reviewStatus === "APPROVED" || reviewStatus === "REJECTED");
}

type PaymentStatus = "UNPAID" | "PAID" | string | null | undefined;

export function getPaymentStatusLabel(paymentStatus: PaymentStatus) {
  return paymentStatus === "PAID" ? "已缴费" : "未缴费";
}

export function getPaymentStatusClass(paymentStatus: PaymentStatus) {
  return paymentStatus === "PAID" ? "status-paid" : "status-unpaid";
}
