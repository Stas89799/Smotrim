<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль</title>
    <link rel="icon" type="image/png" href="images/icons/favicon.ico"/>
        <link rel="icon" type="image/png" href="images/icons/favicon.ico"/>
    <link rel="stylesheet" type="text/css" href="vendor/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="fonts/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" type="text/css" href="fonts/iconic/css/material-design-iconic-font.min.css">
    <link rel="stylesheet" type="text/css" href="vendor/animate/animate.css">
    <link rel="stylesheet" type="text/css" href="vendor/css-hamburgers/hamburgers.min.css">
    <link rel="stylesheet" type="text/css" href="vendor/animsition/css/animsition.min.css">
    <link rel="stylesheet" type="text/css" href="vendor/select2/select2.min.css">
    <link rel="stylesheet" type="text/css" href="vendor/daterangepicker/daterangepicker.css">
    <link rel="stylesheet" type="text/css" href="css/util.css">
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* Добавляем стили для превью аватара */
        .avatar-preview {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            object-fit: cover;
            margin: 15px auto;
            display: none;
        }
    </style>
</head>
<body>
    <div class="limiter">
        <div class="container-login100" style="background-image: url('images/bg-01.jpg');">
            <button class="logout-button" id="logoutButton">Выйти</button>
            <div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
                <form class="login100-form validate-form" id="profileForm" enctype="multipart/form-data">
                    <span class="login100-form-title p-b-49">Профиль пользователя</span>

                    <!-- Блок аватара -->
                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Аватар</span>
                        <input class="input100" type="file" name="avatar" id="avatarInput" accept="image/*">
                        <img src="#" class="avatar-preview" id="avatarPreview" alt="Превью аватара">
                        <span class="focus-input100" data-symbol="&#xf03e;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Название компании</span>
                        <input class="input100" type="text" name="company" placeholder="Введите название вашей компании">
                        <span class="focus-input100" data-symbol="&#xf1ad;"></span>
                    </div>
                    
                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Телефон</span>
                        <input class="input100" type="tel" name="phone" placeholder="Введите ваш телефон" pattern="[0-9]{10,15}">
                        <span class="focus-input100" data-symbol="&#xf2b6;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Имя</span>
                        <input class="input100" type="text" name="firstName" placeholder="Введите ваше имя" required>
                        <span class="focus-input100" data-symbol="&#xf207;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Фамилия</span>
                        <input class="input100" type="text" name="lastName" placeholder="Введите вашу фамилию" required>
                        <span class="focus-input100" data-symbol="&#xf207;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Отчество</span>
                        <input class="input100" type="text" name="middleName" placeholder="Введите ваше отчество">
                        <span class="focus-input100" data-symbol="&#xf207;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Email</span>
                        <input class="input100" type="email" name="email" placeholder="Введите ваш email" required>
                        <span class="focus-input100" data-symbol="&#xf15a;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Instagram</span>
                        <input class="input100" type="text" name="instagram" placeholder="Введите ваш Instagram">
                        <span class="focus-input100" data-symbol="&#xf16d;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Facebook</span>
                        <input class="input100" type="text" name="facebook" placeholder="Введите ваш Facebook">
                        <span class="focus-input100" data-symbol="&#xf09a;"></span>
                    </div>

                    <div class="wrap-input100 validate-input m-b-23">
                        <span class="label-input100">Адрес</span>
                        <input class="input100" type="text" name="address" placeholder="Введите ваш адрес">
                        <span class="focus-input100" data-symbol="&#xf015;"></span>
                    </div>

                    <div class="container-login100-form-btn">
                        <div class="wrap-login100-form-btn">
                            <div class="login100-form-bgbtn"></div>
                            <button class="login100-form-btn" type="submit">Сохранить</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Netlify Identity Widget -->
    <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            // Проверка авторизации
            const user = netlifyIdentity.currentUser();
            if (!user) window.location.href = 'index.html';

            // Элементы DOM
            const profileForm = document.getElementById('profileForm');
            const logoutButton = document.getElementById('logoutButton');
            const avatarInput = document.getElementById('avatarInput');
            const avatarPreview = document.getElementById('avatarPreview');

            // Загрузка существующего профиля
            const loadProfile = async () => {
                try {
                    const response = await fetch('/.netlify/functions/get-profile', {
                        headers: {
                            'Authorization': `Bearer ${user.token.access_token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // Заполнение полей данными
                        Object.keys(data).forEach(key => {
                            const input = profileForm.elements[key];
                            if (input) input.value = data[key];
                        });
                        if (data.avatar) {
                            avatarPreview.style.display = 'block';
                            avatarPreview.src = data.avatar;
                        }
                    }
                } catch (error) {
                    console.error('Ошибка загрузки профиля:', error);
                }
            };

            // Превью аватара
            avatarInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        avatarPreview.style.display = 'block';
                        avatarPreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Отправка формы
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(profileForm);
                
                try {
                    const response = await fetch('/.netlify/functions/save-profile', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.token.access_token}`
                        },
                        body: formData
                    });

                    const result = await response.json();
                    if (response.ok) {
                        alert('Профиль успешно сохранен!');
                        if (result.avatarUrl) {
                            avatarPreview.src = result.avatarUrl;
                        }
                    } else {
                        alert('Ошибка сохранения: ' + (result.error || 'Неизвестная ошибка'));
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('Ошибка соединения с сервером');
                }
            });

            // Выход из системы
            logoutButton.addEventListener('click', () => {
                netlifyIdentity.logout();
                window.location.href = 'index.html';
            });

            // Загружаем профиль при загрузке страницы
            await loadProfile();
        });
    </script>
</body>
</html>
