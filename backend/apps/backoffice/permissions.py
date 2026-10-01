from rest_framework.permissions import BasePermission


class IsActiveStaff(BasePermission):
    message = "Acesso restrito à equipe administrativa."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_staff
        )


class IsActiveSuperuser(BasePermission):
    message = "A restauração da demonstração exige um superusuário ativo."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_superuser
        )
